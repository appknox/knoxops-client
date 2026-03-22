# Device Request Feature - Implementation Summary

**Status:** Part 1 Complete, Part 2 In Progress

**Last Updated:** 2026-03-22

---

## Overview

The Device Request feature is a comprehensive system allowing employees to formally request devices from inventory. The system includes:
- Multi-step approval workflow (pending → approved/rejected → completed)
- Smart device suggestions matching platform and OS version requirements
- Device side-effects on completion (status, purpose, assignedTo updates)
- Slack notifications at each workflow step
- Role-based access control (read-only users see only own requests)
- Detailed audit logging and activity tracking

---

## Part 1: Core Implementation (COMPLETED)

### Backend Database Schema

**File:** `knoxadmin/src/db/schema/device-requests.ts`

```typescript
// pgEnum for status workflow
export const deviceRequestStatusEnum = pgEnum('device_request_status', [
  'pending',
  'approved',
  'rejected',
  'completed',
]);

// Main table with all fields
export const deviceRequests = pgTable('device_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestedBy: uuid('requested_by').notNull().references(() => users.id),
  deviceType: varchar('device_type', { length: 50 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  osVersion: varchar('os_version', { length: 50 }),
  purpose: varchar('purpose', { length: 255 }).notNull(),
  requestingFor: varchar('requesting_for', { length: 255 }), // Who the device is for
  status: deviceRequestStatusEnum('status').notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  linkedDeviceId: uuid('linked_device_id'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectedBy: uuid('rejected_by'),
  rejectedAt: timestamp('rejected_at'),
  completedBy: uuid('completed_by'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

**Migration:** `knoxadmin/drizzle/0012_device_requests_requesting_for.sql`
- Added `requesting_for` varchar column to track intended recipient

### Backend Service & Controller

**File:** `knoxadmin/src/modules/device-requests/device-requests.service.ts`

**Key Functions:**

1. **createRequest(input, userId)**
   - Validates input against CreateDeviceRequestInput schema
   - Inserts new request with pending status
   - Sends Slack notification: "📋 New Device Request" with platform, device type, OS version, purpose, requestingFor
   - Returns full request object

2. **listRequests(userId, role)**
   - Admin/write users: returns all requests sorted by createdAt DESC
   - Read-only users: returns only own requests (requestedBy = userId)
   - Includes parallel user lookups for requestedByUser, rejectedByUser, approvedByUser, completedByUser
   - Joins device name for linkedDeviceId

3. **getRequest(id, userId, role)**
   - Throws ForbiddenError if read-only user tries to access another user's request
   - Returns full request with all user objects

4. **approveRequest(id, approverId)**
   - Validates request status is pending
   - Updates: status→approved, approvedBy, approvedAt
   - Sends Slack notification: "✅ Device Request Approved"
   - Throws BadRequestError if already approved/rejected/completed

5. **rejectRequest(id, rejecterId, reason)**
   - Validates request status is pending or approved
   - Updates: status→rejected, rejectionReason, rejectedBy, rejectedAt
   - Sends Slack notification: "❌ Device Request Rejected" with reason
   - Throws BadRequestError if already rejected or completed

6. **completeRequest(id, completerId, linkedDeviceId?)**
   - Validates request status is approved
   - Wraps in database transaction for atomicity
   - Updates: status→completed, linkedDeviceId, completedBy, completedAt
   - **Device Side-Effects** (if linkedDeviceId provided):
     - Fetches device by ID
     - Updates device status to 'inactive'
     - Sets device.purpose from request.purpose
     - Sets device.assignedTo from request.requestingFor (fallback to requester name)
     - Creates audit log entry with before/after values
     - Returns to service as `{ changeLog: AuditLog }`
   - Sends Slack notification: "📦 Device Request Completed" with device name
   - Throws if device not found or device already in use

### Backend Routes

**File:** `knoxadmin/src/modules/device-requests/device-requests.routes.ts`

Registered at `POST|GET /api/device-requests`:

1. **POST /** - Create Request
   - Auth: authenticate + authorize('read', 'Device')
   - Body: { deviceType, platform, osVersion?, purpose, requestingFor? }
   - Response: 201 with full request

2. **GET /** - List Requests
   - Auth: authenticate + authorize('read', 'Device')
   - Query: page, limit (default 20)
   - Response: { data: DeviceRequest[], pagination: { total, page, limit } }

3. **GET /:id** - Get Single Request
   - Auth: authenticate + authorize('read', 'Device')
   - Response: Single request with all user objects

4. **PATCH /:id/approve** - Approve
   - Auth: authenticate + authorize('manage', 'Device')
   - Response: Approved request

5. **PATCH /:id/reject** - Reject
   - Auth: authenticate + authorize('manage', 'Device')
   - Body: { reason: string }
   - Response: Rejected request with reason

6. **PATCH /:id/complete** - Complete
   - Auth: authenticate + authorize('manage', 'Device')
   - Body: { linkedDeviceId?: uuid }
   - Response: Completed request + device changes (if applicable)

### Device Suggestion Service

**File:** `knoxadmin/src/modules/devices/devices.service.ts`

**New Function: suggestDevices(platform, osVersion?)**
- Filters active devices by platform match
- If osVersion provided: sorts by numeric distance from requested version (exact matches first)
- Returns max 50 devices with: id, name, model, platform, osVersion, status
- Used by frontend CompleteRequestModal to suggest compatible devices

**Route:** `GET /api/devices/suggest?platform=iOS&osVersion=13`

### Slack Notifications

**File:** `knoxadmin/src/services/slack-notification.service.ts`

Updated to include `purpose` field in all 4 device request notifications:

1. **New Request Format:**
   ```
   📋 New Device Request [Request ID: xyz]
   Requested by: John Doe
   Requesting for: Sarah Smith (if different)
   Device: iOS Mobile · Android 13
   Purpose: Testing
   ```

2. **Approved Format:**
   ```
   ✅ Device Request Approved [Request ID: xyz]
   Requested by: John Doe
   Approved by: Admin User
   Device: iOS Mobile · Android 13
   Purpose: Testing
   ```

3. **Rejected Format:**
   ```
   ❌ Device Request Rejected [Request ID: xyz]
   Requested by: John Doe
   Rejected by: Admin User
   Device: iOS Mobile · Android 13
   Purpose: Testing
   Reason: Device not in budget allocation
   ```

4. **Completed Format:**
   ```
   📦 Device Request Completed [Request ID: xyz]
   Requested by: John Doe
   Completed by: Admin User
   Device allocated: A003 - Pixel 7a
   Purpose: Testing
   ```

---

## Part 1: Frontend Implementation (COMPLETED)

### Types & Constants

**File:** `knoxadmin-client/src/types/device-request.types.ts`

```typescript
export type DeviceRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface DeviceRequest {
  id: string;
  requestedBy: string;
  requestedByUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  deviceType: string;
  platform: string;
  osVersion?: string | null;
  purpose: string;
  requestingFor?: string | null; // Who the device is for
  status: DeviceRequestStatus;
  rejectionReason?: string | null;
  linkedDeviceId?: string | null;
  approvedBy?: string | null;
  approvedByUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedByUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  rejectedAt?: string | null;
  completedBy?: string | null;
  completedByUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestedDevice {
  id: string;
  name: string;
  model?: string | null;
  platform?: string | null;
  osVersion?: string | null;
  status: string;
}
```

**File:** `knoxadmin-client/src/constants/deviceOptions.ts`

```typescript
export const PURPOSE_OPTIONS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Production', label: 'Production' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'onPrem', label: 'On-Prem' },
  { value: '__other__', label: 'Other (enter manually)' },
];

export const PLATFORM_OPTIONS_BY_TYPE = {
  mobile: [
    { value: 'iOS', label: 'iOS' },
    { value: 'Android', label: 'Android' },
  ],
  tablet: [
    { value: 'iOS', label: 'iOS' },
    { value: 'Android', label: 'Android' },
  ],
  charging_hub: [
    { value: 'Cambrionix', label: 'Cambrionix' },
  ],
};
```

### API Module

**File:** `knoxadmin-client/src/api/devices.ts` (Extended)

```typescript
// Get distinct OS versions for a platform
getDistinctOsVersions: async (platform: 'iOS' | 'Android'): Promise<string[]> => {
  const response = await apiClient.get<{ versions: string[] }>('/devices/distinct-os-versions', {
    params: { platform },
  });
  return response.data.versions;
},

// Suggest devices for request completion (matches platform + OS version)
suggestDevices: async (platform: string, osVersion?: string): Promise<SuggestedDevice[]> => {
  const response = await apiClient.get<{ data: SuggestedDevice[] }>('/devices/suggest', {
    params: { platform, osVersion },
  });
  return response.data.data;
},
```

**New File:** `knoxadmin-client/src/api/deviceRequests.ts`

```typescript
export const deviceRequestsApi = {
  create: async (input: CreateDeviceRequestInput): Promise<DeviceRequest> => {
    const response = await apiClient.post<DeviceRequest>('/device-requests', input);
    return response.data;
  },

  list: async (params?: ListParams): Promise<{ data: DeviceRequest[]; pagination: { total: number } }> => {
    const response = await apiClient.get('/device-requests', { params });
    return response.data;
  },

  getById: async (id: string): Promise<DeviceRequest> => {
    const response = await apiClient.get<DeviceRequest>(`/device-requests/${id}`);
    return response.data;
  },

  approve: async (id: string): Promise<DeviceRequest> => {
    const response = await apiClient.patch<DeviceRequest>(`/device-requests/${id}/approve`);
    return response.data;
  },

  reject: async (id: string, reason: string): Promise<DeviceRequest> => {
    const response = await apiClient.patch<DeviceRequest>(`/device-requests/${id}/reject`, { reason });
    return response.data;
  },

  complete: async (id: string, linkedDeviceId?: string): Promise<DeviceRequest> => {
    const response = await apiClient.patch<DeviceRequest>(`/device-requests/${id}/complete`, { linkedDeviceId });
    return response.data;
  },
};
```

### State Management

**File:** `knoxadmin-client/src/stores/deviceRequestStore.ts`

Zustand store with:
- State: `requests[]`, `pagination`, `isLoading`, `error`, `showRequestModal`, `selectedRequest`
- Actions:
  - `fetchRequests()` - Load all/own requests
  - `createRequest(input)` - Create, refetch, close modal
  - `approveRequest(id)` - Approve, refetch
  - `rejectRequest(id, reason)` - Reject with reason, refetch
  - `completeRequest(id, linkedDeviceId)` - Complete and link device, refetch
  - `setShowRequestModal(bool)`
  - `selectRequest(request | null)`

### Components

**File:** `knoxadmin-client/src/components/devices/RequestDeviceModal.tsx`

Modal for creating new device requests:
- **Fields:**
  - Device Type (select): mobile | tablet | charging_hub *
  - Platform (select): options based on type *
  - OS Version (input): shown only for mobile/tablet, smart dropdown or manual input
  - Purpose (select → textarea): preset options or manual entry *
  - Requesting For (input): auto-filled with user name, can be changed

- **Behavior:**
  - Device type selection shows platform options
  - Platform selection loads available OS versions via API
  - If versions found: dropdown with "Other" option triggers manual input
  - If no versions: manual input shown directly
  - Purpose field: dropdown with 6 preset options + "Other" button
  - "Other" button switches to textarea for custom purpose
  - "Back to list" button restores dropdown
  - Requestingfor pre-filled from auth store user name

- **Validation:** Zod schema validates all required fields
- **Submit:** Calls `deviceRequestStore.createRequest()`, closes on success

**File:** `knoxadmin-client/src/components/devices/RejectionDetailsModal.tsx`

Modal displaying rejection details on click:
- Shows: Request ID (bold), device info, purpose, rejection reason (highlighted), rejected by user, rejected at timestamp
- Triggered by clicking "ℹ️ Details" button next to rejected status in table
- Properly formats date with locale string
- Extracts user info from request.rejectedByUser

---

## Part 2: Enhanced Modals (IN PROGRESS)

### Planned: CompleteRequestModal.tsx

Updates needed:
- Accept `request: DeviceRequest` prop (currently only uses requestId)
- Replace generic device list with `suggestDevices(request.platform, request.osVersion)`
- Add request context summary showing: "Requested: {platform} {deviceType} | Purpose: {purpose} | OS: {osVersion}+ | Assigning to: {requestingFor}"
- Enhance device rows to show platform + osVersion info
- Searchable device selection

### Planned: RejectRequestModal.tsx

Updates needed:
- Add request context summary showing requested device specs
- Display before reason textarea

### Planned: DeviceRequestsTab.tsx

Updates needed:
- Add "Requesting For" column in admin view
- Display "—" if requestingFor equals requester or is blank

---

## Data Flow

### Creating a Request

```
1. User fills RequestDeviceModal
2. Submits → deviceRequestStore.createRequest()
3. POST /device-requests with: deviceType, platform, osVersion, purpose, requestingFor
4. Backend validates, creates request with pending status
5. Slack notification sent to SLACK_DEVICE_WEBHOOK_URL
6. Store refetches requests
7. Modal closes, toast shown
```

### Approving a Request

```
1. Admin clicks [Approve] button in table
2. PATCH /device-requests/:id/approve
3. Backend validates pending status
4. Updates: status→approved, approvedBy, approvedAt
5. Slack notification sent
6. Store refetches requests
```

### Rejecting a Request

```
1. Admin clicks [Reject] button
2. RejectRequestModal opens (NEW: will show request context)
3. Admin enters reason
4. Submits → PATCH /device-requests/:id/reject with reason
5. Backend validates, updates status→rejected
6. Slack notification sent with reason
7. Store refetches, modal closes
```

### Completing a Request

```
1. Admin clicks [Complete] button on approved request
2. CompleteRequestModal opens (NEW: will show suggestions + request context)
3. Admin selects device from suggestDevices() list
4. PATCH /device-requests/:id/complete with linkedDeviceId
5. Backend transaction:
   - Updates request: status→completed, linkedDeviceId, completedBy, completedAt
   - Updates device: status→inactive, purpose, assignedTo
   - Creates audit log for device changes
6. Slack notification sent
7. Store refetches
```

---

## Error Handling

### Status Transitions

- Cannot approve: if not pending → BadRequestError
- Cannot reject: if completed or already rejected → BadRequestError
- Cannot complete: if not approved → BadRequestError
- Cannot complete: if device not found → BadRequestError

### Permissions

- Read-only users: Can only see own requests (403 if viewing another's)
- Read-only users: Cannot approve/reject/complete (requires manage permission)
- All users: Must have read Device permission to create requests

### Validation

- Zod schemas validate all request inputs
- Backend validates status transitions and permissions
- API validates device existence before linking

---

## Testing Checklist

- [ ] Create request with all fields, verify Slack notification includes all details
- [ ] Create request for different user (requestingFor), verify in notification
- [ ] Approve request, verify status change + Slack notification
- [ ] Reject request with reason, verify rejection details modal shows correctly
- [ ] Complete request with device suggestion, verify device updated with side-effects
- [ ] Verify audit log created for device changes
- [ ] Test read-only user sees only own requests
- [ ] Test OS version dropdown falls back to manual input when no versions found
- [ ] Test purpose dropdown with manual "Other" entry
- [ ] Test pagination in requests table (20 per page)
- [ ] Verify all data columns populated (not empty/unknown)

---

## Known Issues & Resolutions

### Issue 1: Empty Data Columns in Requests Tab
- **Root Cause:** Fastify schema response validation was incomplete
- **Resolution:** Updated schema to document all fields including user objects
- **Status:** ✅ FIXED

### Issue 2: "Rejected By Unknown" in Details Modal
- **Root Cause:** Service only joined users for requestedBy, not rejectedBy/approvedBy/completedBy
- **Resolution:** Added parallel user fetching for all user ID fields
- **Status:** ✅ FIXED

### Issue 3: OS Version Dropdown Not Loading
- **Root Cause:** API call failing silently, no graceful fallback
- **Resolution:** Implemented smart conditional rendering (loading → versions → manual input)
- **Status:** ✅ FIXED

---

## Files Modified/Created Summary

### Backend
| File | Status | Changes |
|------|--------|---------|
| `knoxadmin/src/db/schema/device-requests.ts` | NEW | Schema definition with enum + table |
| `knoxadmin/drizzle/0012_device_requests_requesting_for.sql` | NEW | Migration for requesting_for column |
| `knoxadmin/src/db/schema/index.ts` | MODIFIED | Export device-requests types |
| `knoxadmin/src/modules/device-requests/device-requests.service.ts` | NEW | All CRUD + status transition logic |
| `knoxadmin/src/modules/device-requests/device-requests.controller.ts` | NEW | Request handlers |
| `knoxadmin/src/modules/device-requests/device-requests.routes.ts` | NEW | 6 endpoints + Fastify schemas |
| `knoxadmin/src/modules/devices/devices.service.ts` | MODIFIED | Added suggestDevices() function |
| `knoxadmin/src/modules/devices/devices.controller.ts` | MODIFIED | Added suggestDevices handler |
| `knoxadmin/src/modules/devices/devices.routes.ts` | MODIFIED | Added GET /suggest endpoint |
| `knoxadmin/src/app.ts` | MODIFIED | Registered device-requests routes |
| `knoxadmin/src/services/slack-notification.service.ts` | MODIFIED | Added purpose + requestingFor to notifications |

### Frontend
| File | Status | Changes |
|------|--------|---------|
| `knoxadmin-client/src/types/device-request.types.ts` | NEW | DeviceRequest, SuggestedDevice interfaces |
| `knoxadmin-client/src/constants/deviceOptions.ts` | NEW | Shared PURPOSE_OPTIONS + PLATFORM_OPTIONS_BY_TYPE |
| `knoxadmin-client/src/api/devices.ts` | MODIFIED | Added suggestDevices() function |
| `knoxadmin-client/src/api/deviceRequests.ts` | NEW | All CRUD API functions |
| `knoxadmin-client/src/stores/deviceRequestStore.ts` | NEW | Zustand state management |
| `knoxadmin-client/src/components/devices/RequestDeviceModal.tsx` | NEW | Form for creating requests |
| `knoxadmin-client/src/components/devices/RejectionDetailsModal.tsx` | NEW | Modal showing rejection details |
| `knoxadmin-client/src/components/devices/DeviceRequestsTab.tsx` | NEW | Table of all/own requests |
| `knoxadmin-client/src/components/devices/RequestStatusBadge.tsx` | NEW | Status badge component |
| `knoxadmin-client/src/pages/devices/DeviceListPage.tsx` | MODIFIED | Add Requests tab + button |
| `knoxadmin-client/src/api/index.ts` | MODIFIED | Export deviceRequestsApi |

---

## Next Steps

1. **Complete Part 2 Modal Updates:**
   - CompleteRequestModal: Add request context + smart suggestions
   - RejectRequestModal: Add request context summary
   - DeviceRequestsTab: Add "Requesting For" column

2. **Run Database Migration:**
   - `npm run db:migrate` to apply requesting_for column

3. **End-to-End Testing:**
   - Full workflow from request creation to device completion
   - Verify all Slack notifications with accurate data
   - Test permissions and access control

4. **Documentation:**
   - Update team wiki with device request workflow
   - Add troubleshooting guide for common issues


---

# On-Prem Licence Requests — Global Tab + Request Types + Validations + Bug Fixes

**STATUS:** ✅ COMPLETED

**Completed:** 2026-03-22

---

## Summary of Changes

1. **Global "Licence Requests" tab** at `/onprem` level showing all requests across all clients
2. **Request types**: `license_renewal` vs `patch_update` — different form fields per type
3. **Validation**: 3-month minimum gap between start/end date; one active (pending) request per client at a time
4. **DB migration**: add `request_type` enum + column, `target_version` column
5. **Row click navigation** on the onprem clients listing page to deployment detail page
6. **Cancel request** flow with optional reason (inline textarea in details modal)
7. **Upload / Download / Cancel action buttons** in both global and per-client request tables
8. **Pending request guard**: "Request License" button disabled with tooltip on detail page when pending request exists
9. **All onprem users** (not just admins) can view all licence requests
10. **Slack notifications** with bold labels + request type + cancelled reason

---

## 1. Database Changes

### New enum + columns (`migration 0014`)

```sql
CREATE TYPE license_request_type AS ENUM ('license_renewal', 'patch_update');

ALTER TABLE onprem_license_requests
  ADD COLUMN request_type license_request_type NOT NULL DEFAULT 'license_renewal',
  ADD COLUMN target_version VARCHAR(50);

-- licenseStartDate / licenseEndDate stay NOT NULL — prefilled for patch_update
-- numberOfProjects stays NOT NULL — prefilled for patch_update
```

### Drizzle schema (`src/db/schema/onprem.ts`)

```ts
export const licenseRequestTypeEnum = pgEnum('license_request_type', [
  'license_renewal',
  'patch_update',
]);

// Add to onpremLicenseRequests table:
requestType: licenseRequestTypeEnum('request_type').notNull().default('license_renewal'),
targetVersion: varchar('target_version', { length: 50 }),
```

---

## 2. Backend Changes

### `onprem-license-requests.service.ts`

#### `createLicenseRequest` — add validations

**A. One active request per client:**
```ts
const existing = await db.query.onpremLicenseRequests.findFirst({
  where: and(
    eq(onpremLicenseRequests.deploymentId, deploymentId),
    eq(onpremLicenseRequests.status, 'pending')
  ),
});
if (existing) {
  throw new Error(`A pending licence request (#${existing.requestNo}) already exists for this client. Cancel it before submitting a new one.`);
}
```

**B. 3-month minimum gap:**
```ts
if (input.requestType === 'license_renewal') {
  const diffMs = input.licenseEndDate.getTime() - input.licenseStartDate.getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
  if (diffMonths < 3) {
    throw new Error('License end date must be at least 3 months after the start date.');
  }
}
```

#### `listLicenseRequests` — add global list (no deploymentId filter)

New function `listAllLicenseRequests(userId, role)`:
- Admin: returns all requests across all clients
- Non-admin: returns only requests where `requestedBy = userId`
- JOIN with `onpremDeployments` to include `clientName` in each row

```ts
export async function listAllLicenseRequests(
  userId: string,
  role: string
): Promise<{ requests: LicenseRequestWithDeployment[]; total: number }>
```

### `onprem-license-requests.routes.ts`

Add new route:
```
GET /onprem/licence-requests/all   → listAllLicenseRequests
```

Response includes `clientName` and `deploymentId` on each item.

---

## 3. Frontend Changes

### A. Types (`onprem-license-request.types.ts`)

```ts
export type LicenseRequestType = 'license_renewal' | 'patch_update';

export interface OnpremLicenseRequest {
  // existing fields...
  requestType: LicenseRequestType;
  targetVersion?: string | null;
  // new field from global list join:
  clientName?: string;
}

export interface CreateLicenseRequestInput {
  requestType: LicenseRequestType;
  licenseStartDate: string;
  licenseEndDate: string;
  numberOfProjects: number;
  targetVersion?: string;
  notes?: string;
}
```

### B. `RequestLicenseModal.tsx` — rework form

**Step 1: Type selector** (shown first)
```
○ License Renewal    ○ Patch Update
```

**License Renewal fields:**
- License Start Date (date picker, required)
- License End Date (date picker, required, must be ≥ start + 3 months — validated on blur and submit)
- Number of Projects (number, required)
- Notes (optional)

**Patch Update fields:**
- Target Version (text, prefilled from `deployment.currentVersion`, editable, required)
- License Start Date (prefilled from `deployment.license.startDate`, editable, required)
- License End Date (prefilled from `deployment.license.endDate`, editable, required)
- Number of Projects (prefilled from `deployment.license.numberOfApps`, editable, required)
- Notes (optional)

Validation error for 3-month gap shown inline below end date field.

`RequestLicenseModal` needs to receive `deployment` (not just `deploymentId` + `clientName`) so it can prefill patch update fields.

### C. `AllLicenseRequestsTab.tsx` — new component

Reuses same table structure as `LicenseRequestsTab` but:
- Adds **Client** column after `#`
- Adds **Type** column (`Renewal` / `Patch`) after `#`/Client
- Filters to current user's requests for non-admins (handled server-side)
- Row click → opens `LicenseRequestDetailsModal` (already shows all fields)
- "New Request" button opens a deployment picker first (or navigates to the client detail page)

```tsx
// Columns:
// # | Type | Client | Requested By | License Period | Projects | Status | Requested At | Actions
```

### D. `OnpremPage.tsx` — add "Licence Requests" tab

```tsx
// Add to tabs:
<Route path="licence-requests" element={<AllLicenseRequestsTab />} />
```

Update the tab nav to include "Licence Requests".

### E. `LicenseRequestDetailsModal.tsx` — show request type

Add a "Request Type" row in the details section:
- `license_renewal` → "License Renewal"
- `patch_update` → "Patch Update" + show Target Version

---

## 4. Files to Change

| File | Change |
|---|---|
| `knoxadmin/drizzle/0014_licence_request_type.sql` | New migration |
| `knoxadmin/src/db/schema/onprem.ts` | Add enum + columns |
| `knoxadmin/src/db/schema/index.ts` | Export new enum/type |
| `knoxadmin/src/modules/onprem-license-requests/onprem-license-requests.service.ts` | Validations + `listAllLicenseRequests` |
| `knoxadmin/src/modules/onprem-license-requests/onprem-license-requests.routes.ts` | New `/all` route, update create to accept `requestType` + `targetVersion` |
| `knoxadmin-client/src/types/onprem-license-request.types.ts` | Add `requestType`, `targetVersion`, `clientName` |
| `knoxadmin-client/src/api/onpremLicenseRequests.ts` | Add `listAll()` function |
| `knoxadmin-client/src/stores/onpremLicenseRequestStore.ts` | Add `fetchAllRequests` action |
| `knoxadmin-client/src/components/onprem/RequestLicenseModal.tsx` | Type selector + conditional fields + 3-month validation |
| `knoxadmin-client/src/components/onprem/AllLicenseRequestsTab.tsx` | New component |
| `knoxadmin-client/src/components/onprem/LicenseRequestDetailsModal.tsx` | Show requestType + targetVersion |
| `knoxadmin-client/src/components/onprem/index.ts` | Export new component |
| `knoxadmin-client/src/pages/onprem/OnpremPage.tsx` | Add Licence Requests tab |
| `knoxadmin-client/src/App.tsx` | Add route |
| `knoxadmin-client/src/pages/onprem/OnpremDetailPage.tsx` | Pass full `deployment` to `RequestLicenseModal` |

---

## 5. Implementation Order

1. DB migration + Drizzle schema
2. Backend: validations in `createLicenseRequest`, add `requestType`/`targetVersion` to create input
3. Backend: `listAllLicenseRequests` + `/all` route
4. Frontend types + API + store
5. `RequestLicenseModal` rework
6. `AllLicenseRequestsTab` component
7. `LicenseRequestDetailsModal` — add type/version display
8. `OnpremPage` + `App.tsx` + route

---

## 6. Actual Implementation — Completed Work

All planned items above were implemented. Additional items were identified and implemented during the session.

### Additional Backend Changes

#### `onprem-license-requests.routes.ts`
- Fixed **Fastify response serialization bug**: all response schemas changed from `{ type: 'object' }` to `{ type: 'object', additionalProperties: true }`. Without this, `fast-json-stringify` strips all fields from the response, returning empty `{}` objects.
- Added `consumes` declaration on upload route for Swagger docs consistency.
- Fixed `require('fs').createReadStream` → ESM-compatible `import { createReadStream } from 'fs'` (the `require` call was crashing the Node.js ESM process on every download attempt).

#### `app.ts`
- Added `bodyLimit: 50 * 1024 * 1024` (50MB) to the Fastify instance. Without this, Fastify's default 1MB body limit caused 413 errors on license file uploads even though `@fastify/multipart` was configured with 50MB — the global bodyLimit fires first.

#### `onprem-license-requests.service.ts`
- `listAllLicenseRequests`: removed the `isAdmin` user filter entirely. All onprem users (viewer, admin, etc.) now see all licence requests. Admin gate is on the frontend (`canManageOnprem`) for Upload/Cancel/Download actions only.
- All three `sendSlackNotification` calls (create, upload, cancel) changed to **fire-and-forget** (`.catch()` instead of `await`). The Slack service re-throws on error, which was causing upload and cancel operations to fail entirely after the DB was already updated successfully.
- Slack notification labels all made **bold** (`*Label:*` format).
- Cancel notification: added `*Cancelled Reason:*` line (only shown if reason provided).
- Create notification: added `*Type:*` line showing `Patch Update` or `License Renewal`.

#### `onprem.ts` (onprem routes / schema)
- `onpremDeployments` table: confirmed `getById` route exists for the detail page to fetch a single deployment.

### Additional Frontend Changes

#### `OnpremTable.tsx`
- Added `onRowClick?: (deployment: OnpremDeployment) => void` prop.
- `<tr>` gets `cursor-pointer` + `onClick={() => onRowClick?.(deployment)}`.
- Actions `<td>` gets `e.stopPropagation()` to prevent row click bubbling.

#### `OnpremClientsTab.tsx`
- Passes `onRowClick={(deployment) => navigate('/onprem/${deployment.id}')}` to `OnpremTable`.

#### `OnpremDetailPage.tsx` (new file)
- Fetches deployment via `onpremApi.getById(id)`.
- Two tabs: **Details** (read-only display of all deployment fields) and **Requests** (`LicenseRequestsTab`).
- Uses `useOnpremLicenseRequestStore` to derive `hasPendingRequest`; "Request License" button disabled with tooltip when true.
- Passes full `deployment` object to `RequestLicenseModal` for patch update prefill.

#### `LicenseRequestsTab.tsx`
- Admin action column for pending rows: shows both **Upload** and **Cancel** buttons side by side.

#### `AllLicenseRequestsTab.tsx` (new file)
- Global table across all clients. Columns: `#` | Type badge | Client (clickable → navigate to deployment detail) | Requested By | License Period | Projects | Status | Requested At | Actions.
- Admin action buttons: Upload / Cancel for pending; Download for completed.
- Row click opens `LicenseRequestDetailsModal`.

#### `LicenseRequestDetailsModal.tsx`
- **Cancel flow**: "Cancel Request" button in footer expands inline textarea for reason + "Confirm Cancel" / "Keep it" buttons. State: `showCancelConfirm`, `cancelReason`, `isCancelling`, `cancelError`.
- Added **Type badge** and **Target Version** row in request details section.
- `handleClose` resets all cancel state on close.

#### `LicenseRequestStatusBadge.tsx`
- Added `whitespace-nowrap` + `gap-1` + split emoji/label into separate `<span>` elements to prevent icon and text rendering on separate lines.

#### `RequestLicenseModal.tsx` (full rewrite)
- Type selector radio buttons: License Renewal vs Patch Update.
- `useEffect` on type change: prefills `targetVersion`, `startDate`, `endDate`, `numberOfProjects` from `deployment` prop when `patch_update` selected.
- Inline 3-month gap validation below end date field.
- Server error displayed in red banner.

#### `onpremLicenseRequestStore.ts`
- `uploadFile` and `cancelRequest` store actions: after API call, calls `fetchRequests(deploymentId)` to refresh per-deployment state.

### Migrations Applied
| Migration | Description | Applied |
|---|---|---|
| `0013_onprem_license_requests.sql` | Creates `onprem_license_requests` table, sequence starts at 1000 | ✅ |
| `0014_licence_request_type.sql` | Adds `license_request_type` enum, `request_type` + `target_version` columns | ✅ |

### Bugs Fixed

| Bug | Root Cause | Fix |
|---|---|---|
| Blank page on requests tab — all fields empty | Fastify `{ type: 'object' }` schema strips all fields via `fast-json-stringify` | Added `additionalProperties: true` to all response schemas |
| File upload returns 413 | Fastify default `bodyLimit: 1MB` fires before `@fastify/multipart` can process the body | Set `bodyLimit: 50MB` on Fastify instance |
| File upload succeeds but throws error to frontend | `sendSlackNotification` re-throws; Slack failure rolled back the entire operation | Changed to `.catch()` fire-and-forget |
| Download crashes backend process | `require('fs')` used in ESM module — `ReferenceError: require is not defined` crashes process | Replaced with `import { createReadStream } from 'fs'` |
| Member login can't see licence requests | `listAllLicenseRequests` filtered non-admins to only their own requests | Removed `isAdmin` filter; all onprem users see all requests |
| Status badge icon and text on separate lines | Emoji in flex container wrapping without `whitespace-nowrap` | Added `whitespace-nowrap`, `gap-1`, split into `<span>` elements |
| `jsonwebtoken` package missing on startup | `jsonwebtoken` used in service but not installed | `npm install jsonwebtoken @types/jsonwebtoken` |

---

---

# Dashboard Page — Implementation Plan

**Status:** 🔲 PENDING
**Last Updated:** 2026-03-22

---

## Overview

Add a `/dashboard` route with a real overview page (currently redirects to `/devices`). The design uses two donut-chart stat cards, a recent activity feed, quick actions, and a secondary info card. All dummy content is replaced with live data from the existing APIs.

---

## Design → Real Data Mapping

### Stat Card 1 — "On-Premise Deployments"
Donut chart showing deployment status breakdown.

**Data source:** `onpremApi.getDeployments()` — aggregate by `clientStatus`

| Segment | Color | Condition |
|---------|-------|-----------|
| Active | `#E5493A` (primary) | `clientStatus === 'active'` |
| Inactive | `#fbbf24` (amber) | `clientStatus === 'inactive'` |
| Cancelled | `#94a3b8` (slate) | `clientStatus === 'cancelled'` |

Legend shows count + label (e.g. "12 Active").

### Stat Card 2 — "Device Inventory"
Donut chart from `devicesApi.getDeviceStats()`.

| Segment | Color | Condition |
|---------|-------|-----------|
| In Use | `#E5493A` (primary) | All devices minus `inInventory` |
| Available | `#10b981` (emerald) | `stats.inInventory` |

Legend shows count + label.

### Recent Activity Feed
Pull from `auditLogsApi.getAuditLogs({ limit: 5 })`. Map each log entry to an icon + message:

| Module | Icon | Example text |
|--------|------|--------------|
| `device` + `create` | `devices` | "New device registered: A001" |
| `device` + `update` | `edit` | "Device updated: B012" |
| `device_request` + `approve` | `check_circle` | "Device request approved" |
| `device_request` + `reject` | `cancel` | "Device request rejected" |
| `onprem` + `create` | `developer_board` | "New deployment: ClientName" |
| `onprem_license_request` + `create` | `description` | "License request created" |
| `onprem_license_request` + `upload` | `upload_file` | "License file uploaded" |
| `user` + `invite` | `person_add` | "User invited: email@..." |

Show relative timestamps (e.g. "12 mins ago"). "View all logs" links to `/settings` (audit log section) or `/devices`.

### Quick Actions
Replace generic buttons with app-specific actions:

| Label | Icon | Action |
|-------|------|--------|
| Register Device | `add_circle` | Navigate to `/devices/register` |
| View On-Prem Clients | `developer_board` | Navigate to `/onprem/clients` |
| Manage Users | `group` | Navigate to `/settings` (admin only) |
| License Requests | `description` | Navigate to `/onprem/licence-requests` |

Show admin-only actions only when `authStore.user.role === 'admin'`.

### Secondary Info Card (replaces "Cloud Infrastructure")
**"Upcoming Patches"** card using `notificationsApi.previewPatchReminders(10)`.

- If patches exist: show count badge ("N patches due in the next 10 days"), list up to 3 clients with urgency color, link "View All → /onprem/notifications"
- If no patches: show green "All up to date" message
- Background: keep the primary red gradient from the design

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/pages/dashboard/DashboardPage.tsx` | New — main dashboard page component |
| `src/App.tsx` | Add `/dashboard` route; change default redirect from `/devices` to `/dashboard` |
| `src/components/layout/Navbar.tsx` | Update Dashboard link href from `#` to `/dashboard` and mark active |

---

## DashboardPage Component Structure

```
DashboardPage
├── Header row (title + Export/Manage buttons)
├── Stats Grid (2 cols)
│   ├── OnpremDeploymentsCard   — fetches onprem list, counts by status
│   └── DeviceInventoryCard     — fetches device stats
├── Activity + Sidebar grid (3 cols)
│   ├── RecentActivityFeed      — fetches audit logs (last 5)
│   └── Sidebar (1 col)
│       ├── QuickActionsCard    — static nav links, role-gated
│       └── UpcomingPatchesCard — fetches patch preview
```

Each sub-section is a self-contained component inside `DashboardPage.tsx` (no separate files needed unless they grow large).

---

## Donut Chart Implementation

No chart library needed — pure CSS `conic-gradient` matching the design:

```ts
// Build gradient string from segments
function buildDonutGradient(segments: { pct: number; color: string }[]) {
  let pos = 0;
  return segments.map(({ pct, color }) => {
    const from = pos;
    pos += pct;
    return `${color} ${from}% ${pos}%`;
  }).join(', ');
}
```

Render:
```tsx
<div
  className="relative w-20 h-20 rounded-full flex items-center justify-center"
  style={{ background: `conic-gradient(${gradient})` }}
>
  <div className="absolute inset-4 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
    <span className="text-xs font-bold">{total}</span>
  </div>
</div>
```

---

## Backend — No New Routes Needed

All data is available from existing endpoints:
- `GET /onprem/deployments` — for deployment status counts
- `GET /devices/stats` — for device inventory counts
- `GET /audit-logs` — for recent activity feed
- `GET /notifications/patch-reminders/preview?daysAhead=10` — for upcoming patches

---

## API Additions (client-side only)

`auditLogsApi` may need a `limit` param added to its query. Verify the existing implementation in `src/api/audit-logs.ts` before adding anything.

---

## Data Loading Strategy

Use local `useState` + `useEffect` in `DashboardPage` (not Zustand stores — dashboard data is read-only and doesn't need to be shared). Fetch all 4 endpoints in parallel with `Promise.allSettled` so a single failure doesn't blank the whole page.

```ts
const [onpremData, devicesData, auditData, patchData] = await Promise.allSettled([
  onpremApi.getDeployments({ limit: 500 }),
  devicesApi.getDeviceStats(),
  auditLogsApi.getAuditLogs({ limit: 5 }),
  notificationsApi.previewPatchReminders(10),
]);
```

---

## Role-Based Visibility

- **Admin / onprem_admin:** all cards visible
- **onprem_viewer:** show onprem card, hide device inventory, hide user-related quick actions
- **full_editor / full_viewer:** show device card, hide onprem card, hide onprem quick actions
- Check via `authStore.user.role`

---

## Verification Steps

1. `/dashboard` route loads without errors
2. Donut charts render with real data (not hardcoded percentages)
3. "0 deployments" / "0 devices" states show gracefully (empty donut = solid gray ring)
4. Recent activity shows real logs with correct icons
5. Upcoming patches card shows real count or "All up to date"
6. Quick action buttons navigate correctly
7. Admin-only actions hidden for non-admin roles
8. All 4 data fetches fail gracefully (show skeleton/error per card independently)

