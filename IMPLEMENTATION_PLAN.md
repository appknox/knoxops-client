# Implementation Plan: On-Prem Listing Page Updates

**STATUS:** ✅ COMPLETED (2026-03-15)

## Overview

Four changes to the on-prem listing page:
1. Sort records by `createdAt` descending by default
2. Remove Health Status and Maintenance Plan filters
3. Add Appknox Version filter (API-level)
4. Change pagination default to 30 records per page

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/onprem.types.ts` | Add `currentVersion` to `ListOnpremParams` |
| `src/stores/onpremStore.ts` | Update filter interface, defaults, and `fetchDeployments` logic |
| `src/api/onprem.ts` | Add `getDistinctVersions()` API function |
| `src/components/onprem/OnpremFilters.tsx` | Remove two filters, add version filter dropdown |

---

## Change 1 — Default Sort by `createdAt`

**File:** `src/stores/onpremStore.ts`

**Current state (line 122–123):**
```ts
sortBy: 'lastPatchDate',
sortOrder: 'desc',
```

**Change to:**
```ts
sortBy: 'createdAt',
sortOrder: 'desc',
```

No other changes needed — `createdAt` is already a valid value in `ListOnpremParams['sortBy']` union (line 164 of `onprem.types.ts`).

---

## Change 2 — Remove Health Status & Maintenance Plan Filters

### 2a. `src/stores/onpremStore.ts`

**Remove `status` and `maintenancePlan` from the `OnpremFilters` interface (lines 23–29):**

Current:
```ts
interface OnpremFilters {
  search: string;
  clientStatus: ClientStatus | '';
  status: DeploymentStatus | '';
  environmentType: EnvironmentType | '';
  maintenancePlan: MaintenancePlan | '';
}
```

Change to:
```ts
interface OnpremFilters {
  search: string;
  clientStatus: ClientStatus | '';
  environmentType: EnvironmentType | '';
  appknoxVersion: string;
}
```

**Remove from `initialFilters` (lines 104–110):**

Current:
```ts
const initialFilters: OnpremFilters = {
  search: '',
  clientStatus: '',
  status: '',
  environmentType: '',
  maintenancePlan: '',
};
```

Change to:
```ts
const initialFilters: OnpremFilters = {
  search: '',
  clientStatus: '',
  environmentType: '',
  appknoxVersion: '',
};
```

**Remove unused imports from `onpremStore.ts` (line 11):**
- Remove `DeploymentStatus` and `MaintenancePlan` from the import list (only if they are not used elsewhere in the file).

**Update `fetchDeployments` (lines 163–167):**

Current:
```ts
if (filters.search) params.search = filters.search;
if (filters.clientStatus) params.clientStatus = filters.clientStatus;
if (filters.status) params.status = filters.status;
if (filters.environmentType) params.environmentType = filters.environmentType;
if (filters.maintenancePlan) params.maintenancePlan = filters.maintenancePlan;
```

Change to:
```ts
if (filters.search) params.search = filters.search;
if (filters.clientStatus) params.clientStatus = filters.clientStatus;
if (filters.environmentType) params.environmentType = filters.environmentType;
if (filters.appknoxVersion) params.currentVersion = filters.appknoxVersion;
```

### 2b. `src/components/onprem/OnpremFilters.tsx`

**Remove these constant arrays (lines 12–32):**
```ts
const deploymentStatusOptions = [ ... ];  // remove entirely
const maintenanceOptions = [ ... ];       // remove entirely
```

**Remove these two `<Select>` JSX blocks (lines 67–81):**
```tsx
<div className="w-44">
  <Select
    options={deploymentStatusOptions}
    value={filters.status}
    onChange={(e) => setFilters({ status: e.target.value as DeploymentStatus | '' })}
  />
</div>

<div className="w-44">
  <Select
    options={maintenanceOptions}
    value={filters.maintenancePlan}
    onChange={(e) => setFilters({ maintenancePlan: e.target.value as MaintenancePlan | '' })}
  />
</div>
```

**Update `hasActiveFilters` (line 37–38):**

Current:
```ts
const hasActiveFilters =
  filters.search || filters.clientStatus || filters.status || filters.environmentType || filters.maintenancePlan;
```

Change to:
```ts
const hasActiveFilters =
  filters.search || filters.clientStatus || filters.environmentType || filters.appknoxVersion;
```

**Remove unused imports (line 4):**
```ts
// Remove DeploymentStatus and MaintenancePlan from the import
import type { ClientStatus, EnvironmentType } from '@/types';
```

---

## Change 3 — Add Appknox Version Filter

### 3a. `src/types/onprem.types.ts`

**Add `currentVersion` to `ListOnpremParams` (lines 154–166):**

Current:
```ts
export interface ListOnpremParams {
  page?: number;
  limit?: number;
  search?: string;
  clientStatus?: ClientStatus;
  status?: DeploymentStatus;
  environmentType?: EnvironmentType;
  maintenancePlan?: MaintenancePlan;
  environment?: string;
  region?: string;
  sortBy?: 'clientName' | 'name' | 'createdAt' | 'updatedAt' | 'lastPatchDate' | 'firstDeploymentDate' | 'clientStatus' | 'status' | 'customerName';
  sortOrder?: 'asc' | 'desc';
}
```

Change to (add `currentVersion`, keep existing fields for backwards compat):
```ts
export interface ListOnpremParams {
  page?: number;
  limit?: number;
  search?: string;
  clientStatus?: ClientStatus;
  status?: DeploymentStatus;
  environmentType?: EnvironmentType;
  maintenancePlan?: MaintenancePlan;
  currentVersion?: string;
  environment?: string;
  region?: string;
  sortBy?: 'clientName' | 'name' | 'createdAt' | 'updatedAt' | 'lastPatchDate' | 'firstDeploymentDate' | 'clientStatus' | 'status' | 'customerName';
  sortOrder?: 'asc' | 'desc';
}
```

### 3b. `src/api/onprem.ts`

**Add `getDistinctVersions()` function** after the `list` function:

```ts
getDistinctVersions: async (): Promise<string[]> => {
  const response = await apiClient.get<{ data: string[] }>('/onprem/distinct-versions');
  return response.data.data;
},
```

> **Backend dependency:** This assumes the backend exposes `GET /onprem/distinct-versions` returning `{ data: string[] }` — a list of unique non-null `currentVersion` values across all on-prem records, sorted. Confirm with the backend team before implementing.

### 3c. `src/components/onprem/OnpremFilters.tsx`

**Add `useEffect` and `useState` imports**, and `onpremApi` import:
```ts
import { useState, useEffect } from 'react';
import { onpremApi } from '@/api';
```

**Fetch distinct versions on component mount:**
```ts
const [versionOptions, setVersionOptions] = useState<{ value: string; label: string }[]>([
  { value: '', label: 'All Versions' },
]);

useEffect(() => {
  onpremApi.getDistinctVersions().then((versions) => {
    setVersionOptions([
      { value: '', label: 'All Versions' },
      ...versions.map((v) => ({ value: v, label: v })),
    ]);
  });
}, []);
```

**Add the Appknox Version `<Select>` in JSX** (after the Environment dropdown, before the Clear button):
```tsx
<div className="w-44">
  <Select
    options={versionOptions}
    value={filters.appknoxVersion}
    onChange={(e) => setFilters({ appknoxVersion: e.target.value })}
  />
</div>
```

---

## Change 4 — Pagination Default: 30 per page

**File:** `src/stores/onpremStore.ts`

**Update pagination initial state (lines 115–120):**

Current:
```ts
pagination: {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
},
```

Change to:
```ts
pagination: {
  page: 1,
  limit: 30,
  total: 0,
  totalPages: 0,
},
```

---

## Final State of Query Params Sent to API

| Param | Before | After |
|-------|--------|-------|
| `search` | yes | yes |
| `clientStatus` | yes | yes |
| `environmentType` | yes | yes |
| `status` (health) | yes | **removed** |
| `maintenancePlan` | yes | **removed** |
| `currentVersion` | no | **added** |
| `sortBy` | `lastPatchDate` | **`createdAt`** |
| `sortOrder` | `desc` | `desc` |
| `page` | yes | yes |
| `limit` | `20` default | **`30` default** |

---

## Implementation Order

1. `src/types/onprem.types.ts` — add `currentVersion` to `ListOnpremParams`
2. `src/api/onprem.ts` — add `getDistinctVersions()`
3. `src/stores/onpremStore.ts` — update interface, initialFilters, sortBy default, limit default, fetchDeployments
4. `src/components/onprem/OnpremFilters.tsx` — remove two filters, add version filter

## Pre-Implementation Checklist

- [ ] Confirm backend supports `GET /onprem/distinct-versions` endpoint
- [ ] Confirm backend accepts `currentVersion` as a query param on `GET /onprem`
- [ ] Confirm backend sorts by `createdAt` when `sortBy=createdAt` is passed

---

## Completion Log

### ✅ Completed on 2026-03-15

All four changes have been successfully implemented:

1. **Sort by `createdAt`** — Updated `src/stores/onpremStore.ts` default sort
2. **Removed filters** — Removed Health Status and Maintenance Plan from store and UI
3. **Added Version filter** — Added `currentVersion` to API params, `getDistinctVersions()` function, and UI dropdown
4. **Pagination update** — Changed default limit to 30 records per page

**Files modified:**
- `src/types/onprem.types.ts`
- `src/api/onprem.ts`
- `src/stores/onpremStore.ts`
- `src/components/onprem/OnpremFilters.tsx`

---

---

# Implementation Plan: Network Configuration Validations

**STATUS:** ✅ COMPLETED (2026-03-15)

## Overview

Add client-side validation for Network Configuration fields in the on-prem register/edit form (`onprem/:id/edit` and `onprem/register`). Errors must appear on blur of each field. Validations also run on form submit.

**Fields to validate:**
| Field | Rule |
|-------|------|
| Static IP | Valid IPv4 address |
| Gateway | Valid IPv4 address |
| Netmask | Valid IPv4 address |
| DNS Servers | Each comma-separated value must be a valid IPv4 address |
| NTP Server | Valid IPv4 address OR valid domain name |
| SMTP Server | Valid IPv4 address OR valid domain name |

All fields are optional — validation only fires when the field has a non-empty value.

---

## File to Modify

**Only one file:** `src/pages/onprem/RegisterOnpremPage.tsx`

---

## Step 1 — Add/Reuse Validation Helpers (lines 182–189)

The existing regex constants and helper can be reused as-is:

```ts
// Already present — no changes needed:
const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const isValidDomainOrIP = (value: string): boolean => { ... }; // already exists
```

Add one new helper for validating DNS servers (comma-separated IPs), directly after `isValidDomainOrIP`:

```ts
const isValidIP = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is valid (optional field)
  return IP_REGEX.test(value.trim());
};

const isValidDnsServers = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is valid (optional field)
  return value.split(',').every((ip) => IP_REGEX.test(ip.trim()));
};
```

---

## Step 2 — Extend `validateForm()` with Network Validations (after line 253)

Add the following block inside `validateForm()`, after the existing `licenseNumberOfApps` check and before the `return` statement:

```ts
// Network Configuration validations
if (data.staticIP && !isValidIP(data.staticIP)) {
  errors.staticIP = 'Please enter a valid IPv4 address (e.g. 192.168.1.100)';
}
if (data.gateway && !isValidIP(data.gateway)) {
  errors.gateway = 'Please enter a valid IPv4 address (e.g. 192.168.1.1)';
}
if (data.netmask && !isValidIP(data.netmask)) {
  errors.netmask = 'Please enter a valid IPv4 address (e.g. 255.255.255.0)';
}
if (data.dnsServers && !isValidDnsServers(data.dnsServers)) {
  errors.dnsServers = 'Each DNS server must be a valid IPv4 address';
}
if (data.ntpServer && !isValidDomainOrIP(data.ntpServer)) {
  errors.ntpServer = 'Please enter a valid IP address or hostname (e.g. pool.ntp.org)';
}
if (data.smtpServer && !isValidDomainOrIP(data.smtpServer)) {
  errors.smtpServer = 'Please enter a valid IP address or hostname (e.g. smtp.example.com)';
}
```

---

## Step 3 — Add `handleNetworkFieldBlur()` Handler (after `handleDateBlur`, line 497)

Add a single reusable blur handler for all network fields:

```ts
const handleNetworkFieldBlur = (field: keyof FormData) => {
  const value = (formData[field] as string) || '';

  // Clear existing error first
  setFieldErrors((prev) => {
    const updated = { ...prev };
    delete updated[field];
    return updated;
  });

  if (!value.trim()) return; // Empty = valid (optional fields)

  let error: string | null = null;

  if (field === 'staticIP' || field === 'gateway' || field === 'netmask') {
    if (!isValidIP(value)) {
      error = 'Please enter a valid IPv4 address';
    }
  } else if (field === 'dnsServers') {
    if (!isValidDnsServers(value)) {
      error = 'Each DNS server must be a valid IPv4 address';
    }
  } else if (field === 'ntpServer' || field === 'smtpServer') {
    if (!isValidDomainOrIP(value)) {
      error = 'Please enter a valid IP address or hostname';
    }
  }

  if (error) {
    setFieldErrors((prev) => ({ ...prev, [field]: error! }));
  }
};
```

---

## Step 4 — Wire Up `onBlur` and `error` Props in JSX (lines 1518–1559)

Update each of the 6 network `<Input>` components to add `onBlur` and `error` props:

### Static IP (line 1518)
```tsx
<Input
  label="Static IP"
  value={formData.staticIP}
  onChange={(e) => handleChange('staticIP', e.target.value)}
  onBlur={() => handleNetworkFieldBlur('staticIP')}
  error={fieldErrors.staticIP}
  placeholder="192.168.1.100"
  tooltip="Static IP address assigned to the Appknox server"
/>
```

### Gateway (line 1525)
```tsx
<Input
  label="Gateway"
  value={formData.gateway}
  onChange={(e) => handleChange('gateway', e.target.value)}
  onBlur={() => handleNetworkFieldBlur('gateway')}
  error={fieldErrors.gateway}
  placeholder="192.168.1.1"
  tooltip="Default gateway IP address for network routing"
/>
```

### Netmask (line 1532)
```tsx
<Input
  label="Netmask"
  value={formData.netmask}
  onChange={(e) => handleChange('netmask', e.target.value)}
  onBlur={() => handleNetworkFieldBlur('netmask')}
  error={fieldErrors.netmask}
  placeholder="255.255.255.0"
  tooltip="Network mask defining the subnet (e.g., 255.255.255.0)"
/>
```

### DNS Servers (line 1539)
```tsx
<Input
  label="DNS Servers (comma-separated)"
  value={formData.dnsServers}
  onChange={(e) => handleChange('dnsServers', e.target.value)}
  onBlur={() => handleNetworkFieldBlur('dnsServers')}
  error={fieldErrors.dnsServers}
  placeholder="8.8.8.8, 8.8.4.4"
  tooltip="DNS server addresses separated by commas for domain name resolution"
/>
```

### NTP Server (line 1546)
```tsx
<Input
  label="NTP Server"
  value={formData.ntpServer}
  onChange={(e) => handleChange('ntpServer', e.target.value)}
  onBlur={() => handleNetworkFieldBlur('ntpServer')}
  error={fieldErrors.ntpServer}
  placeholder="pool.ntp.org"
  tooltip="Network Time Protocol server for time synchronization"
/>
```

### SMTP Server (line 1553)
```tsx
<Input
  label="SMTP Server"
  value={formData.smtpServer}
  onChange={(e) => handleChange('smtpServer', e.target.value)}
  onBlur={() => handleNetworkFieldBlur('smtpServer')}
  error={fieldErrors.smtpServer}
  placeholder="smtp.example.com"
  tooltip="SMTP server address for sending email notifications"
/>
```

---

## Summary of Changes

| Location | What Changes |
|----------|-------------|
| After `isValidDomainOrIP` (~line 189) | Add `isValidIP()` and `isValidDnsServers()` helpers |
| Inside `validateForm()` (~line 253) | Add 6 network field validation checks |
| After `handleDateBlur()` (~line 497) | Add `handleNetworkFieldBlur()` handler |
| JSX lines 1518, 1525, 1532, 1539, 1546, 1553 | Add `onBlur` + `error` props to each network `<Input>` |

No new files. No new dependencies. No changes to types, store, or API layer.

---

## Completion Log

### ✅ Completed on 2026-03-15

All network configuration validations have been successfully implemented:

1. **Validation Helpers** — Added `isValidIP()` and `isValidDnsServers()` functions
2. **Form Validation** — Added 6 network field checks in `validateForm()`
3. **Blur Handler** — Created `handleNetworkFieldBlur()` for real-time validation
4. **JSX Updates** — Wired up `onBlur` and `error` props to all 6 network input fields

**File modified:**
- `src/pages/onprem/RegisterOnpremPage.tsx`

Validations work on blur and form submit for: Static IP, Gateway, Netmask, DNS Servers, NTP Server, and SMTP Server.

---

---

# Implementation Plan: On-Prem API Authentication & Authorization Tests

**STATUS:** ✅ COMPLETED (2026-03-15)

**Location:** Backend — `/Users/appknox/Documents/projects/knoxadmin-workplace/knoxadmin`

## Overview

Add authentication and authorization test coverage to the on-prem API test suite. Currently all 27 tests in `tests/onprem.test.ts` use only the `admin` role. No test verifies that unauthenticated requests are rejected, or that role-based access control works correctly for any endpoint.

---

## Background: Role Permission Matrix

| Role | GET (list/read) | POST (create) | PUT/PATCH (update) | DELETE |
|------|:-:|:-:|:-:|:-:|
| `admin` | ✅ | ✅ | ✅ | ✅ |
| `onprem_admin` | ✅ | ✅ | ✅ | ❌ |
| `onprem_viewer` | ✅ | ❌ | ❌ | ❌ |
| `full_editor` | ✅ | ✅ | ✅ | ✅ |
| `full_viewer` | ✅ | ❌ | ❌ | ❌ |
| `devices_admin` | ❌ | ❌ | ❌ | ❌ |
| `devices_viewer` | ❌ | ❌ | ❌ | ❌ |

**Key asymmetry:** `onprem_admin` can create and update but **cannot delete** (only `admin` and `full_editor` can delete).

---

## File to Create

**New file:** `tests/onprem.auth.test.ts`

Kept separate from `onprem.test.ts` to isolate auth/authz concerns from functional validation tests.

---

## Test Setup

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getApp, loginUser, initializeTests, teardownTests,
  createTestUser, createTestOnpremDeployment, testUsers,
} from './setup.js';

// Role-specific tokens populated in beforeAll
let adminToken: string;
let onpremAdminToken: string;
let onpremViewerToken: string;
let fullEditorToken: string;
let fullViewerToken: string;
let devicesAdminToken: string;
let devicesViewerToken: string;

// A real deployment ID for update/delete/get tests
let testDeploymentId: string;

describe('Onprem API — Authentication & Authorization', () => {
  beforeAll(async () => {
    await initializeTests(); // creates admin + member test users, cleans up

    const app = await getApp();

    // Create one user per role
    await createTestUser({ email: 'onprem-admin@test.com', firstName: 'OnpremAdmin', lastName: 'User', role: 'onprem_admin', password: 'pass123' });
    await createTestUser({ email: 'onprem-viewer@test.com', firstName: 'OnpremViewer', lastName: 'User', role: 'onprem_viewer', password: 'pass123' });
    await createTestUser({ email: 'full-editor@test.com', firstName: 'FullEditor', lastName: 'User', role: 'full_editor', password: 'pass123' });
    await createTestUser({ email: 'full-viewer@test.com', firstName: 'FullViewer', lastName: 'User', role: 'full_viewer', password: 'pass123' });
    await createTestUser({ email: 'devices-admin@test.com', firstName: 'DevicesAdmin', lastName: 'User', role: 'devices_admin', password: 'pass123' });
    await createTestUser({ email: 'devices-viewer@test.com', firstName: 'DevicesViewer', lastName: 'User', role: 'devices_viewer', password: 'pass123' });

    // Login all users to get tokens
    ({ accessToken: adminToken } = await loginUser(app, testUsers.admin.email, testUsers.admin.password));
    ({ accessToken: onpremAdminToken } = await loginUser(app, 'onprem-admin@test.com', 'pass123'));
    ({ accessToken: onpremViewerToken } = await loginUser(app, 'onprem-viewer@test.com', 'pass123'));
    ({ accessToken: fullEditorToken } = await loginUser(app, 'full-editor@test.com', 'pass123'));
    ({ accessToken: fullViewerToken } = await loginUser(app, 'full-viewer@test.com', 'pass123'));
    ({ accessToken: devicesAdminToken } = await loginUser(app, 'devices-admin@test.com', 'pass123'));
    ({ accessToken: devicesViewerToken } = await loginUser(app, 'devices-viewer@test.com', 'pass123'));

    // Create a test deployment using admin (to use as fixture for update/delete tests)
    const created = await createTestOnpremDeployment(app, adminToken);
    testDeploymentId = created.json().id;
  });

  afterAll(async () => {
    await teardownTests();
  });

  // ... test describe blocks below
});
```

---

## Describe Block 1 — Unauthenticated Requests (no token)

Every on-prem endpoint must return **401** when called without a token.

Test a representative set covering list, create, update, delete, and a sub-resource read:

```ts
describe('Unauthenticated requests → 401', () => {
  it('GET /api/onprem returns 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/onprem' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/onprem returns 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'POST', url: '/api/onprem', payload: {} });
    expect(res.statusCode).toBe(401);
  });

  it('PUT /api/onprem/:id returns 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'PUT', url: `/api/onprem/${testDeploymentId}`, payload: {} });
    expect(res.statusCode).toBe(401);
  });

  it('DELETE /api/onprem/:id returns 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'DELETE', url: `/api/onprem/${testDeploymentId}` });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/onprem/:id returns 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: `/api/onprem/${testDeploymentId}` });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/onprem/check-email returns 401', async () => {
    const app = await getApp();
    const res = await app.inject({ method: 'GET', url: '/api/onprem/check-email?email=x@y.com' });
    expect(res.statusCode).toBe(401);
  });
});
```

---

## Describe Block 2 — Invalid Token

```ts
describe('Invalid/expired token → 401', () => {
  it('GET /api/onprem returns 401 for a bogus token', async () => {
    const app = await getApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/onprem',
      headers: { authorization: 'Bearer this-is-not-a-valid-jwt' },
    });
    expect(res.statusCode).toBe(401);
  });
});
```

---

## Describe Block 3 — `devices_admin` Role (no OnPrem access)

`devices_admin` has no permissions on `OnPrem` resource — all endpoints must return **403**.

```ts
describe('devices_admin role → 403 on all onprem endpoints', () => {
  it('GET /api/onprem returns 403', async () => { ... });
  it('POST /api/onprem returns 403', async () => { ... });
  it('PUT /api/onprem/:id returns 403', async () => { ... });
  it('DELETE /api/onprem/:id returns 403', async () => { ... });
  it('GET /api/onprem/:id returns 403', async () => { ... });
});
```

Each test follows the same pattern: inject with `headers: { authorization: \`Bearer ${devicesAdminToken}\` }`, assert `res.statusCode === 403`.

---

## Describe Block 4 — `devices_viewer` Role (no OnPrem access)

Same as Block 3, using `devicesViewerToken`. Cover at least GET (list) and POST (create) to confirm both read and write are blocked.

```ts
describe('devices_viewer role → 403 on all onprem endpoints', () => {
  it('GET /api/onprem returns 403', async () => { ... });
  it('POST /api/onprem returns 403', async () => { ... });
});
```

---

## Describe Block 5 — `onprem_viewer` Role (read-only)

`onprem_viewer` can **read** OnPrem but not write.

```ts
describe('onprem_viewer role — read allowed, writes blocked', () => {
  it('GET /api/onprem returns 200', async () => {
    // expect statusCode 200, body.data to be an array
  });

  it('GET /api/onprem/:id returns 200', async () => {
    // expect statusCode 200
  });

  it('POST /api/onprem returns 403', async () => {
    // expect statusCode 403
  });

  it('PUT /api/onprem/:id returns 403', async () => {
    // expect statusCode 403
  });

  it('DELETE /api/onprem/:id returns 403', async () => {
    // expect statusCode 403
  });

  it('GET /api/onprem/check-email returns 200', async () => {
    // expect statusCode 200
  });
});
```

---

## Describe Block 6 — `full_viewer` Role (read-only)

Same permission shape as `onprem_viewer`. Cover list, get-by-id, and one write attempt.

```ts
describe('full_viewer role — read allowed, writes blocked', () => {
  it('GET /api/onprem returns 200', async () => { ... });
  it('GET /api/onprem/:id returns 200', async () => { ... });
  it('POST /api/onprem returns 403', async () => { ... });
  it('DELETE /api/onprem/:id returns 403', async () => { ... });
});
```

---

## Describe Block 7 — `onprem_admin` Role (manage, but cannot delete)

`onprem_admin` can create and update but the **delete route requires `admin` or `full_editor`** only.

```ts
describe('onprem_admin role — can create/update, cannot delete', () => {
  it('GET /api/onprem returns 200', async () => { ... });

  it('POST /api/onprem creates successfully (201)', async () => {
    // Use createTestOnpremDeployment helper with onpremAdminToken
    // expect statusCode 201
  });

  it('PUT /api/onprem/:id updates successfully (200)', async () => {
    // inject PUT with onpremAdminToken, payload: { notes: 'updated' }
    // expect statusCode 200
  });

  it('DELETE /api/onprem/:id returns 403', async () => {
    // expect statusCode 403 — onprem_admin cannot delete
  });
});
```

---

## Describe Block 8 — `full_editor` Role (full manage including delete)

`full_editor` has full manage on OnPrem — create, update, and delete all succeed.

```ts
describe('full_editor role — full access including delete', () => {
  it('GET /api/onprem returns 200', async () => { ... });

  it('POST /api/onprem creates successfully (201)', async () => {
    // create with fullEditorToken, expect 201
  });

  it('PUT /api/onprem/:id updates successfully (200)', async () => {
    // update testDeploymentId with fullEditorToken, expect 200
  });

  it('DELETE /api/onprem/:id deletes successfully (200)', async () => {
    // create a fresh deployment with adminToken, then delete with fullEditorToken
    // expect 200 or 204
  });
});
```

---

## Complete Test Count

| Describe Block | Tests |
|---------------|-------|
| Unauthenticated (no token) | 6 |
| Invalid token | 1 |
| `devices_admin` — all blocked | 5 |
| `devices_viewer` — all blocked | 2 |
| `onprem_viewer` — read yes, write no | 6 |
| `full_viewer` — read yes, write no | 4 |
| `onprem_admin` — manage but no delete | 4 |
| `full_editor` — full manage | 4 |
| **Total** | **32** |

---

## Completion Log

### ✅ Completed on 2026-03-15

Created comprehensive test suite covering all authentication and authorization scenarios:

**File created:** `tests/onprem.auth.test.ts`
- All 8 describe blocks implemented with 32 test cases
- Tests: unauthenticated requests, invalid tokens, role-based access control
- Verifies correct HTTP status codes (401, 403, 200) for each role

---

## Implementation Notes

- **Do not modify** `tests/onprem.test.ts` — all new tests go in the new file.
- The `beforeAll` creates 6 additional test users beyond those already in `setup.ts`. These are cleaned up by `teardownTests()` since `cleanupTestData()` deletes all `%@test.com` users.
- For Blocks 7 and 8 (write tests), create a fresh deployment inside the test or use `testDeploymentId` for updates. Avoid deleting `testDeploymentId` until all describe blocks that need it are done — delete tests should create their own fixture deployment.
- The `createTestUser` helper already supports all roles (confirmed in `setup.ts` type signature).
- All write-permission tests that expect `403` do **not** need a valid payload — the auth middleware runs before validation, so even an empty payload will be rejected at the auth layer.

---

---

# Implementation Plan: Comment Authorization Fixes & Tests

**STATUS:** ✅ COMPLETED (2026-03-15)

**Location:** Backend — `/Users/appknox/Documents/projects/knoxadmin-workplace/knoxadmin`

## Overview

Three issues found with comment authorization:

1. **Route-level authorization is wrong** — POST/PUT/DELETE comment routes all use `authorize('read', 'OnPrem')`, which lets read-only roles (onprem_viewer, full_viewer) edit and delete comments
2. **Wrong error class on ownership violation** — service throws `new Error()` instead of `ForbiddenError`, causing a 500 instead of a 403 when a non-owner tries to edit/delete
3. **No tests** exist for any comment endpoint

---

## Fix 1 — Correct Route-Level Authorization

**File:** `src/modules/onprem/onprem.routes.ts`

### POST `/:id/comments` (line 800)

**No change** — keep `authorize('read', 'OnPrem')`. Any user who can view the deployment (including `onprem_viewer` and `full_viewer`) can post a comment. This is the intended behavior.

### PUT `/:id/comments/:commentId` (line 838)

Change from:
```ts
preHandler: [authenticate, authorize('read', 'OnPrem')]
```
To:
```ts
preHandler: [authenticate, authorize('update', 'OnPrem')]
```

### DELETE `/:id/comments/:commentId` (line 877)

Change from:
```ts
preHandler: [authenticate, authorize('read', 'OnPrem')]
```
To:
```ts
preHandler: [authenticate, authorize('delete', 'OnPrem')]
```

> **Note:** After this fix, `onprem_admin` will be blocked from deleting comments at the route level (since `onprem_admin` does not have `delete` on OnPrem). If `onprem_admin` should be able to delete comments, the permission matrix in `src/lib/abilities.ts` needs to be updated to grant `onprem_admin` the `delete` action on `OnPrem` comments specifically — or a dedicated comment subject could be introduced.

---

## Fix 2 — Use Correct Error Class for Ownership Violations

**File:** `src/modules/onprem/onprem.service.ts`

### Step 1 — Add `ForbiddenError` to import (line 13)

Current:
```ts
import { NotFoundError, ConflictError } from '../../middleware/errorHandler.js';
```

Change to:
```ts
import { NotFoundError, ConflictError, ForbiddenError } from '../../middleware/errorHandler.js';
```

### Step 2 — Fix `updateComment` (line 586)

Current:
```ts
if (existing.createdBy !== userId) {
  throw new Error('Unauthorized: Only comment creator can edit');
}
```

Change to:
```ts
if (existing.createdBy !== userId) {
  throw new ForbiddenError('Only the comment creator can edit this comment');
}
```

### Step 3 — Fix `deleteComment` (line 609)

Current:
```ts
if (existing.createdBy !== userId) {
  throw new Error('Unauthorized: Only comment creator can delete');
}
```

Change to:
```ts
if (existing.createdBy !== userId) {
  throw new ForbiddenError('Only the comment creator can delete this comment');
}
```

**Impact:** Non-owners attempting to edit/delete will now receive HTTP **403** instead of **500**.

---

## Fix 3 — Add Comment Tests

**New file:** `tests/onprem.comments.test.ts`

### Setup

```ts
// Users needed:
// - adminToken (from testUsers.admin)
// - onpremViewerToken (role: onprem_viewer) — can read, should be able to comment if Option A chosen
// - devicesAdminToken (role: devices_admin) — no OnPrem access at all

// Fixtures created in beforeAll:
// - testDeploymentId: created by admin
// - commentByAdmin: a comment posted by admin (used to test non-owner rejection)
```

### Test Group 1 — Unauthenticated (no token → 401)

```ts
it('GET /:id/comments returns 401 without token')
it('POST /:id/comments returns 401 without token')
it('PUT /:id/comments/:commentId returns 401 without token')
it('DELETE /:id/comments/:commentId returns 401 without token')
```

### Test Group 2 — No OnPrem access (`devices_admin` → 403)

```ts
it('GET /:id/comments returns 403 for devices_admin')
it('POST /:id/comments returns 403 for devices_admin')
it('PUT /:id/comments/:commentId returns 403 for devices_admin')
it('DELETE /:id/comments/:commentId returns 403 for devices_admin')
```

### Test Group 3 — Create a Comment

```ts
it('admin can create a comment (201)')
it('onprem_viewer can create a comment (201)')  // viewers are allowed to comment
it('devices_admin cannot create a comment (403)') // no OnPrem access at all
```

### Test Group 4 — Ownership: Edit

```ts
it('creator (admin) can edit their own comment (200)')

it('non-creator gets 403 when editing another user\'s comment', async () => {
  // 1. Admin creates a comment → commentId
  // 2. A second user (e.g. onprem_viewer or another admin) attempts PUT on that commentId
  // 3. Expect statusCode 403 (not 500 — this verifies Fix 2 is applied)
  expect(res.statusCode).toBe(403);
  expect(res.json().message).toContain('creator');
})
```

### Test Group 5 — Ownership: Delete

```ts
it('creator (admin) can delete their own comment (200)')

it('non-creator gets 403 when deleting another user\'s comment', async () => {
  // 1. Admin creates a comment → commentId
  // 2. Second user attempts DELETE on that commentId
  // 3. Expect 403
  expect(res.statusCode).toBe(403);
  expect(res.json().message).toContain('creator');
})
```

### Test Group 6 — Soft Delete Verification

```ts
it('deleted comment does not appear in GET /:id/comments list', async () => {
  // 1. Admin creates a comment
  // 2. Admin deletes it
  // 3. GET /:id/comments → comment should not be present (or isDeleted: true filtered out)
})
```

---

## Summary

| Fix | File | Lines |
|-----|------|-------|
| Route auth: PUT comments `'read'` → `'update'` | `onprem.routes.ts` | 838 |
| Route auth: DELETE comments `'read'` → `'delete'` | `onprem.routes.ts` | 877 |
| Import `ForbiddenError` | `onprem.service.ts` | 13 |
| Ownership error in `updateComment` | `onprem.service.ts` | 586 |
| Ownership error in `deleteComment` | `onprem.service.ts` | 609 |
| New test file | `tests/onprem.comments.test.ts` | new |

## Completion Log

### ✅ Completed on 2026-03-15

**Backend Fixes Applied:**
- ✅ Updated PUT comment route authorization: `'read'` → `'update'` (line 838)
- ✅ Updated DELETE comment route authorization: `'read'` → `'delete'` (line 877)
- ✅ Fixed `updateComment` error handling: `Error` → `ForbiddenError` (line 586)
- ✅ Fixed `deleteComment` error handling: `Error` → `ForbiddenError` (line 609)
- ✅ Added `ForbiddenError` import (line 13)

**Test File Created:** `tests/onprem.comments.test.ts`
- 6 test groups with comprehensive coverage
- Tests: unauthenticated access, role-based access, comment creation, edit ownership, delete ownership, soft-delete verification

## Decision Log

- **POST /:id/comments** keeps `authorize('read', 'OnPrem')` — viewers (`onprem_viewer`, `full_viewer`) are allowed to post comments. Confirmed 2026-03-15.

---

---

# Implementation Plan: Role-Based UI Visibility (Hide Edit/Delete/Add for Read-Only Roles)

**STATUS:** ✅ COMPLETED (2026-03-15)

**Location:** Frontend — `/Users/appknox/Documents/projects/knoxadmin-workplace/knoxadmin-client`

## Problem

All action buttons (Edit, Delete, Register/Add) are rendered unconditionally for every user who can access the page. Read-only roles (`onprem_viewer`, `full_viewer`, `devices_viewer`) can see and click buttons they have no permission to use. The server will reject the API call, but the UI should not show them in the first place.

---

## Permission Matrix (from backend source of truth)

| Role | OnPrem: Add/Edit | OnPrem: Delete | Devices: Add/Edit | Devices: Delete |
|------|:-:|:-:|:-:|:-:|
| `admin` | ✅ | ✅ | ✅ | ✅ |
| `onprem_admin` | ✅ | ❌ | — | — |
| `onprem_viewer` | ❌ | ❌ | — | — |
| `full_editor` | ✅ | ✅ | ✅ | ✅ |
| `full_viewer` | ❌ | ❌ | ❌ | ❌ |
| `devices_admin` | — | — | ✅ | ✅ |
| `devices_viewer` | — | — | ❌ | ❌ |

> — means the role has no access to that section at all (nav already hides it)

**Key asymmetry:** `onprem_admin` can create and edit on-prem records but **cannot delete** them. The Delete button must be hidden specifically for this role.

---

## Step 1 — Create `src/hooks/usePermissions.ts` (new file)

Centralise all permission logic in one place so every component reads from the same source.

```ts
import { useAuthStore } from '@/stores';

export const usePermissions = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  return {
    // On-Prem
    canManageOnprem: ['admin', 'onprem_admin', 'full_editor'].includes(role ?? ''),
    canDeleteOnprem: ['admin', 'full_editor'].includes(role ?? ''),

    // Devices
    canManageDevices: ['admin', 'devices_admin', 'full_editor'].includes(role ?? ''),
    canDeleteDevices: ['admin', 'devices_admin', 'full_editor'].includes(role ?? ''),
  };
};
```

No new dependencies. Returns `false` for all flags when `user` is null (e.g. during initial load).

---

## Step 2 — `src/components/onprem/OnpremTable.tsx`

### 2a — Import the hook

```ts
import { usePermissions } from '@/hooks/usePermissions';
```

### 2b — Call the hook inside the component

```ts
const { canManageOnprem, canDeleteOnprem } = usePermissions();
```

### 2c — Edit button — disabled state for unauthorized roles (currently lines 151–157)

Buttons are shown to all roles but **disabled** (grayed out, non-clickable, cursor-not-allowed) when the user lacks permission. This is better UX than hiding — users can see the action exists but understand they can't use it.

Current:
```tsx
<button
  onClick={() => onEdit(deployment)}
  className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
  title="Edit"
>
  <Pencil className="h-4 w-4" />
</button>
```

Change to:
```tsx
<button
  onClick={canManageOnprem ? () => onEdit(deployment) : undefined}
  disabled={!canManageOnprem}
  className={`p-1.5 rounded-lg transition-colors ${
    canManageOnprem
      ? 'text-orange-600 hover:bg-orange-50 cursor-pointer'
      : 'text-gray-300 cursor-not-allowed'
  }`}
  title={canManageOnprem ? 'Edit' : 'You do not have permission to edit'}
>
  <Pencil className="h-4 w-4" />
</button>
```

### 2d — Delete button — disabled state for unauthorized roles (currently lines 158–164)

Current:
```tsx
<button
  onClick={() => onDelete(deployment)}
  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
  title="Delete"
>
  <Trash2 className="h-4 w-4" />
</button>
```

Change to:
```tsx
<button
  onClick={canDeleteOnprem ? () => onDelete(deployment) : undefined}
  disabled={!canDeleteOnprem}
  className={`p-1.5 rounded-lg transition-colors ${
    canDeleteOnprem
      ? 'text-red-600 hover:bg-red-50 cursor-pointer'
      : 'text-gray-300 cursor-not-allowed'
  }`}
  title={canDeleteOnprem ? 'Delete' : 'You do not have permission to delete'}
>
  <Trash2 className="h-4 w-4" />
</button>
```

> View (Eye), Download, and Comments (MessageSquare) buttons remain unconditional — all roles with OnPrem access can use these.

---

## Step 3 — `src/pages/onprem/OnpremListPage.tsx`

### 3a — Import the hook

```ts
import { usePermissions } from '@/hooks/usePermissions';
```

### 3b — Call the hook

```ts
const { canManageOnprem } = usePermissions();
```

### 3c — Conditionally render "Register New Client" button (currently lines 64–69)

Current:
```tsx
<Link to="/onprem/register">
  <Button ...>
    <Plus className="h-4 w-4 mr-2" />
    Register New Client
  </Button>
</Link>
```

Change to:
```tsx
{canManageOnprem && (
  <Link to="/onprem/register">
    <Button ...>
      <Plus className="h-4 w-4 mr-2" />
      Register New Client
    </Button>
  </Link>
)}
```

---

## Step 4 — `src/components/devices/DeviceTable.tsx`

### 4a — Import and call hook

```ts
import { usePermissions } from '@/hooks/usePermissions';
// inside component:
const { canManageDevices, canDeleteDevices } = usePermissions();
```

### 4b — Edit button — disabled state for unauthorized roles (currently lines 148–153)

```tsx
<button
  onClick={canManageDevices ? () => onEdit(device) : undefined}
  disabled={!canManageDevices}
  className={`p-1.5 rounded-lg transition-colors ${
    canManageDevices
      ? 'text-orange-600 hover:bg-orange-50 cursor-pointer'
      : 'text-gray-300 cursor-not-allowed'
  }`}
  title={canManageDevices ? 'Edit' : 'You do not have permission to edit'}
>
  <Pencil className="h-4 w-4" />
</button>
```

### 4c — Delete button — disabled state for unauthorized roles (currently lines 155–160)

```tsx
<button
  onClick={canDeleteDevices ? () => onDelete(device) : undefined}
  disabled={!canDeleteDevices}
  className={`p-1.5 rounded-lg transition-colors ${
    canDeleteDevices
      ? 'text-red-600 hover:bg-red-50 cursor-pointer'
      : 'text-gray-300 cursor-not-allowed'
  }`}
  title={canDeleteDevices ? 'Delete' : 'You do not have permission to delete'}
>
  <Trash2 className="h-4 w-4" />
</button>
```

> View History (History icon) button remains unconditional.

---

## Step 5 — `src/pages/devices/DeviceListPage.tsx`

### 5a — Import and call hook

```ts
import { usePermissions } from '@/hooks/usePermissions';
// inside component:
const { canManageDevices } = usePermissions();
```

### 5b — Conditionally render "Register New Device" button (currently lines 50–55)

Current:
```tsx
<Link to="/devices/register">
  <Button ...>
    <Plus className="h-4 w-4 mr-2" />
    Register New Device
  </Button>
</Link>
```

Change to:
```tsx
{canManageDevices && (
  <Link to="/devices/register">
    <Button ...>
      <Plus className="h-4 w-4 mr-2" />
      Register New Device
    </Button>
  </Link>
)}
```

---

## Summary of All Changes

| File | Change |
|------|--------|
| `src/hooks/usePermissions.ts` | **New file** — centralised permission flags |
| `src/components/onprem/OnpremTable.tsx` | Edit and Delete buttons disabled (grayed out) for unauthorized roles |
| `src/pages/onprem/OnpremListPage.tsx` | "Register New Client" button hidden for unauthorized roles |
| `src/components/devices/DeviceTable.tsx` | Edit and Delete buttons disabled (grayed out) for unauthorized roles |
| `src/pages/devices/DeviceListPage.tsx` | "Register New Device" button hidden for unauthorized roles |

> **Design decision:** Edit and Delete buttons in tables are **disabled** (visible but grayed out with `cursor-not-allowed` and a tooltip explaining why) rather than hidden. The Register/Add buttons in page headers are fully **hidden** since showing a disabled "Register" button in the header is less useful.

## Roles and What They See After This Fix

| Role | OnPrem Edit | OnPrem Delete | OnPrem Register | Device Edit | Device Delete | Device Register |
|------|:-:|:-:|:-:|:-:|:-:|:-:|
| `admin` | ✅ active | ✅ active | ✅ shown | ✅ active | ✅ active | ✅ shown |
| `onprem_admin` | ✅ active | ⚫ disabled | ✅ shown | — | — | — |
| `onprem_viewer` | ⚫ disabled | ⚫ disabled | ❌ hidden | — | — | — |
| `full_editor` | ✅ active | ✅ active | ✅ shown | ✅ active | ✅ active | ✅ shown |
| `full_viewer` | ⚫ disabled | ⚫ disabled | ❌ hidden | ⚫ disabled | ⚫ disabled | ❌ hidden |
| `devices_admin` | — | — | — | ✅ active | ✅ active | ✅ shown |
| `devices_viewer` | — | — | — | ⚫ disabled | ⚫ disabled | ❌ hidden |

---

## Completion Log

### ✅ Completed on 2026-03-15

All five steps have been successfully implemented:

1. **Permission Hook** — Created `src/hooks/usePermissions.ts` with centralized permission flags
2. **OnPrem Table** — Updated `src/components/onprem/OnpremTable.tsx` with disabled Edit/Delete buttons for unauthorized roles
3. **OnPrem List Page** — Updated `src/pages/onprem/OnpremListPage.tsx` to conditionally hide "Register New Client" button
4. **Device Table** — Updated `src/components/devices/DeviceTable.tsx` with disabled Edit/Delete buttons for unauthorized roles
5. **Device List Page** — Updated `src/pages/devices/DeviceListPage.tsx` to conditionally hide "Register New Device" button

**Files modified:**
- `src/hooks/usePermissions.ts` (NEW)
- `src/components/onprem/OnpremTable.tsx`
- `src/pages/onprem/OnpremListPage.tsx`
- `src/components/devices/DeviceTable.tsx`
- `src/pages/devices/DeviceListPage.tsx`

**UI Behavior:**
- Edit/Delete buttons in tables are now disabled (grayed out, non-clickable) for read-only roles with explanatory tooltips
- Register/Add buttons in page headers are now completely hidden for read-only roles
- Full audit trail visible in usePermissions hook for consistent permission enforcement

---

---

# Implementation Plan: Soft Delete for On-Prem Deployments & Devices

**STATUS:** ✅ COMPLETED (2026-03-15)

**Location:** Backend — `/Users/appknox/Documents/projects/knoxadmin-workplace/knoxadmin`

## Overview

Currently, deleting an on-prem deployment or device permanently removes the row and all associated audit history. Replace hard deletes with soft deletes by adding an `is_deleted` boolean column to both tables. Deleted records are hidden from all queries but retained in the database. Each soft delete is recorded as an activity in the audit log.

Comments remain hard-deleted (they already use soft delete via `is_deleted` on `onprem_comments`, which is appropriate).

---

## Files to Modify

| File | Change |
|------|--------|
| `src/db/schema/onprem.ts` | Add `isDeleted` column to `onpremDeployments` table |
| `src/db/schema/devices.ts` | Add `isDeleted` column to `devices` table |
| `drizzle/` | New migration SQL file |
| `src/modules/onprem/onprem.service.ts` | Soft delete logic + filter all queries + audit log |
| `src/modules/devices/devices.service.ts` | Soft delete logic + filter all queries + audit log |

---

## Step 1 — Schema: Add `is_deleted` Column

### `src/db/schema/onprem.ts`

Follow the same pattern already used in `onpremComments` (line 165 of the same file). Add to the `onpremDeployments` table definition:

```ts
// Add after updatedAt column
isDeleted: boolean('is_deleted').default(false),
```

### `src/db/schema/devices.ts`

Add to the `devices` table definition:

```ts
// Add after updatedAt column
isDeleted: boolean('is_deleted').default(false),
```

---

## Step 2 — Migration File

Create a new file in `drizzle/` following the existing naming convention (e.g. `0006_soft_delete_onprem_devices.sql`):

```sql
ALTER TABLE "onprem_deployments" ADD COLUMN "is_deleted" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "is_deleted" boolean DEFAULT false;
--> statement-breakpoint
CREATE INDEX "onprem_deployments_is_deleted_idx" ON "onprem_deployments" USING btree ("is_deleted");
--> statement-breakpoint
CREATE INDEX "devices_is_deleted_idx" ON "devices" USING btree ("is_deleted");
```

> The index ensures list queries with `WHERE is_deleted = false` remain performant as the table grows.

---

## Step 3 — Soft Delete Logic: `onprem.service.ts`

### 3a — Change `deleteOnprem()` (line 275–281)

Current (hard delete):
```ts
export async function deleteOnprem(id: string): Promise<OnpremDeployment> {
  const deployment = await getOnpremById(id);
  await db.delete(onpremDeployments).where(eq(onpremDeployments.id, id));
  return deployment;
}
```

Change to (soft delete + audit log):
```ts
export async function deleteOnprem(
  id: string,
  userId: string
): Promise<OnpremDeployment> {
  const deployment = await getOnpremById(id);

  await db
    .update(onpremDeployments)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(onpremDeployments.id, id));

  await createAuditLog({
    userId,
    module: 'onprem',
    action: 'deployment_deleted',
    entityType: 'onprem_deployment',
    entityId: id,
    entityName: deployment.clientName,
    changes: {
      before: { isDeleted: false },
      after: { isDeleted: true },
    },
  });

  return deployment;
}
```

> `userId` must now be passed in from the controller (`request.user.id`). Update the controller call accordingly.

### 3b — Add `isDeleted = false` filter to all SELECT queries (6 locations)

| Function | Location | Filter to add |
|----------|----------|---------------|
| `listOnprem()` — main query | ~line 110 | `eq(onpremDeployments.isDeleted, false)` added to `whereClause` via `and()` |
| `listOnprem()` — count query | ~line 117 | Same filter |
| `getOnpremById()` | ~line 146 | `and(eq(onpremDeployments.id, id), eq(onpremDeployments.isDeleted, false))` |
| `checkEmailExists()` | ~line 325 | Add `eq(onpremDeployments.isDeleted, false)` to conditions array |
| `checkPhoneExists()` | ~line 354 | Add `eq(onpremDeployments.isDeleted, false)` to conditions array |
| `getDistinctVersions()` | ~line 723 | Wrap existing SQL condition with `and(..., eq(onpremDeployments.isDeleted, false))` |

**Effect of `getOnpremById()` filter:** A soft-deleted record will throw a `NotFoundError` (since the function already throws on no result), making soft-deleted records behave identically to non-existent records for all GET/PUT/PATCH/DELETE operations.

---

## Step 4 — Soft Delete Logic: `devices.service.ts`

### 4a — Change `deleteDevice()` (line 183–189)

Current (hard delete):
```ts
export async function deleteDevice(id: string): Promise<Device> {
  const device = await getDeviceById(id);
  await db.delete(devices).where(eq(devices.id, id));
  return device;
}
```

Change to (soft delete + audit log):
```ts
export async function deleteDevice(
  id: string,
  userId: string
): Promise<Device> {
  const device = await getDeviceById(id);

  await db
    .update(devices)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(devices.id, id));

  await createAuditLog({
    userId,
    module: 'devices',
    action: 'device_deleted',
    entityType: 'device',
    entityId: id,
    entityName: device.name,
    changes: {
      before: { isDeleted: false },
      after: { isDeleted: true },
    },
  });

  return device;
}
```

### 4b — Add `isDeleted = false` filter to all SELECT queries (6 locations)

| Function | Location | Filter to add |
|----------|----------|---------------|
| `listDevices()` — main query | ~line 93 | `eq(devices.isDeleted, false)` added to `whereClause` via `and()` |
| `listDevices()` — count query | ~line 100 | Same filter |
| `getDeviceById()` | ~line 118 | Add `eq(devices.isDeleted, false)` to `findFirst` where clause |
| `createDevice()` serial duplicate check | ~line 132 | Add `eq(devices.isDeleted, false)` so deleted serials can be reused |
| `updateDevice()` serial duplicate check | ~line 162 | Add `eq(devices.isDeleted, false)` |
| `getDeviceStats()` | ~line 224 | Add `.where(eq(devices.isDeleted, false))` before `.groupBy()` |

---

## Step 5 — Update Controllers to Pass `userId`

Both delete controllers must now pass the authenticated user's ID to the service function.

### `onprem.controller.ts` — `deleteDeployment` handler

```ts
// Before
const result = await deleteOnprem(id);

// After
const user = request.user as User;
const result = await deleteOnprem(id, user.id);
```

### `devices.controller.ts` — `deleteDevice` handler

```ts
// Before
const device = await deleteDevice(id);

// After
const user = request.user as User;
const device = await deleteDevice(id, user.id);
```

---

## Step 6 — Import `createAuditLog` in Service Files

Both service files need to import the audit log function if not already imported.

```ts
import { createAuditLog } from '../../services/audit-log.service.js';
```

Check existing imports in each service file before adding.

---

## Behaviour After This Change

| Scenario | Before | After |
|----------|--------|-------|
| Delete on-prem record | Row permanently removed | `is_deleted = true`, row kept |
| Delete device | Row permanently removed | `is_deleted = true`, row kept |
| GET deleted record by ID | 404 (row gone) | 404 (filtered out, same UX) |
| List deleted records | Gone from list | Filtered out, same UX |
| Audit log on delete | Not recorded | ✅ Recorded as `deployment_deleted` / `device_deleted` |
| Associated history/versions/comments | Cascade-deleted | ✅ All preserved |
| Duplicate email/phone check | Only checks live rows | ✅ Only checks live rows (deleted frees up the value) |
| Duplicate serial number check | Only checks live rows | ✅ Deleted serials can be re-registered |

---

## Implementation Order

1. Schema files (`onprem.ts`, `devices.ts`) — add `isDeleted` column
2. Migration SQL file — run to apply DB changes
3. `onprem.service.ts` — soft delete + 6 query filters + audit log import
4. `devices.service.ts` — soft delete + 6 query filters + audit log import
5. `onprem.controller.ts` — pass `userId` to `deleteOnprem()`
6. `devices.controller.ts` — pass `userId` to `deleteDevice()`

---

## Completion Log

### ✅ Completed on 2026-03-15

All soft delete implementation steps have been successfully completed:

**Schema Changes:**
- ✅ Added `isDeleted` boolean column to `onpremDeployments` table
- ✅ Added `isDeleted` boolean column to `devices` table
- ✅ Created migration file `drizzle/0006_soft_delete_onprem_devices.sql` with indexes

**On-Prem Service (`onprem.service.ts`):**
- ✅ Added `createAuditLog` import
- ✅ Updated `listOnprem()` to filter `isDeleted = false`
- ✅ Updated `getOnpremById()` to filter `isDeleted = false`
- ✅ Changed `deleteOnprem()` to soft delete with audit log (now takes `userId` parameter)
- ✅ Updated `checkEmailExists()` to exclude deleted records
- ✅ Updated `checkPhoneExists()` to exclude deleted records
- ✅ Updated `getDistinctVersions()` to exclude deleted records

**On-Prem Controller (`onprem.controller.ts`):**
- ✅ Updated `remove()` to pass `userId` to `deleteOnprem()`
- ✅ Removed duplicate audit log call (service now handles it)

**Devices Service (`devices.service.ts`):**
- ✅ Added `createAuditLog` import
- ✅ Updated `listDevices()` to filter `isDeleted = false`
- ✅ Updated `getDeviceById()` to filter `isDeleted = false`
- ✅ Changed `deleteDevice()` to soft delete with audit log (now takes `userId` parameter)
- ✅ Updated `createDevice()` serial duplicate check to exclude deleted records
- ✅ Updated `updateDevice()` serial duplicate check to exclude deleted records
- ✅ Updated `getDeviceStats()` to exclude deleted records

**Devices Controller (`devices.controller.ts`):**
- ✅ Updated `remove()` to pass `userId` to `deleteDevice()`
- ✅ Removed duplicate audit log call (service now handles it)

**Result:**
All deletes are now soft deletes with full audit trails. Deleted records remain in the database but are hidden from all queries. Deleted email/phone/serial values can be reused for new records.

---

---

# Implementation Plan: On-Prem Listing Filters Overhaul

**STATUS:** ✅ COMPLETED (2026-03-15)

## Overview

Three changes to the on-prem listing page filter bar:
1. ✅ Removed the Export button
2. ✅ Added a **multi-select** CSM user filter (populated from distinct CSM users assigned to on-prem records)
3. ✅ Changed the Appknox version filter from a single `<Select>` to a **multi-select**

Both new multi-select filters operate at the API level (query params) so pagination remains correct.

---

## Files to Modify

### Frontend
| File | Change |
|------|--------|
| `src/components/ui/MultiSelect.tsx` | **New** — reusable multi-select dropdown component |
| `src/components/ui/index.ts` | Export `MultiSelect` |
| `src/types/onprem.types.ts` | Update `ListOnpremParams` for array filters |
| `src/api/onprem.ts` | Add `getDistinctCsmUsers()` function |
| `src/stores/onpremStore.ts` | Update `OnpremFilters` interface + `fetchDeployments` |
| `src/components/onprem/OnpremFilters.tsx` | Remove Export, swap selects for multi-selects |

### Backend
| File | Change |
|------|--------|
| `src/modules/onprem/onprem.service.ts` | Support `currentVersions[]` and `csmIds[]` array filters |
| `src/modules/onprem/onprem.routes.ts` | Add `getDistinctCsmUsers` route |
| `src/modules/onprem/onprem.controller.ts` | Add `getDistinctCsmUsers` controller |

---

## Step 1 — New `MultiSelect` UI Component

**File:** `src/components/ui/MultiSelect.tsx` (new file)

A self-contained dropdown with checkboxes. No new dependencies — built with plain React + Tailwind + existing patterns.

**Props interface:**
```ts
interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];               // array of selected values
  onChange: (values: string[]) => void;
  placeholder?: string;             // shown when nothing selected, e.g. "All Versions"
  label?: string;
}
```

**Behaviour:**
- Closed state: shows placeholder or a comma-joined summary of selected labels (e.g. `v1.0, v2.0 (+1)`)
- Open state: dropdown list with a checkbox per option
- Clicking an option toggles it in/out of `selected`
- Clicking outside closes the dropdown (`useEffect` with `mousedown` listener)
- No "Select All" needed for MVP

**Export:** Add `MultiSelect` to `src/components/ui/index.ts`

---

## Step 2 — Backend: `getDistinctCsmUsers` Endpoint

### `src/modules/onprem/onprem.service.ts`

Add a new function that returns distinct CSM users actually assigned to at least one on-prem record (excluding soft-deleted records):

```ts
export async function getDistinctCsmUsers(): Promise<{ id: string; firstName: string; lastName: string; email: string }[]> {
  const results = await db
    .selectDistinct({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(onpremDeployments)
    .innerJoin(users, eq(onpremDeployments.associatedCsmId, users.id))
    .where(and(
      isNotNull(onpremDeployments.associatedCsmId),
      eq(onpremDeployments.isDeleted, false)
    ))
    .orderBy(asc(users.firstName));

  return results;
}
```

### `src/modules/onprem/onprem.controller.ts`

Add controller handler:

```ts
export async function getDistinctCsmUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const results = await getDistinctCsmUsers();
  return reply.send({ data: results });
}
```

### `src/modules/onprem/onprem.routes.ts`

Register the route (before `:id` routes to avoid param conflicts):

```ts
app.get('/distinct-csm-users', {
  preHandler: [authenticate, authorize('read', 'OnPrem')],
  schema: {
    tags: ['On-prem'],
    summary: 'Get distinct CSM users assigned to on-prem deployments',
  },
  handler: getDistinctCsmUsersHandler,
});
```

---

## Step 3 — Backend: Support Array Filters in `listOnprem`

### Update `ListOnpremQuery` interface in `onprem.service.ts`

Change:
```ts
currentVersion?: string;
```
Add:
```ts
currentVersions?: string[];   // replaces currentVersion for multi-select
csmIds?: string[];            // new: filter by one or more CSM user IDs
```

### Update `listOnprem()` filter logic

Replace the single `currentVersion` condition:
```ts
// Remove:
if (currentVersion) {
  conditions.push(eq(onpremDeployments.currentVersion, currentVersion));
}

// Add:
if (currentVersions && currentVersions.length > 0) {
  conditions.push(inArray(onpremDeployments.currentVersion, currentVersions));
}

if (csmIds && csmIds.length > 0) {
  conditions.push(inArray(onpremDeployments.associatedCsmId, csmIds));
}
```

Import `inArray` from `drizzle-orm` if not already imported.

---

## Step 4 — Frontend Types: `src/types/onprem.types.ts`

Update `ListOnpremParams`:

```ts
// Remove:
currentVersion?: string;

// Add:
currentVersions?: string[];
csmIds?: string[];
```

---

## Step 5 — Frontend API: `src/api/onprem.ts`

Add `getDistinctCsmUsers()` alongside the existing `getDistinctVersions()`:

```ts
getDistinctCsmUsers: async (): Promise<{ id: string; firstName: string; lastName: string; email: string }[]> => {
  const response = await apiClient.get<{ data: { id: string; firstName: string; lastName: string; email: string }[] }>(
    '/onprem/distinct-csm-users'
  );
  return response.data.data;
},
```

**Note on array serialisation:** Axios serialises `string[]` params as `csmIds[]=x&csmIds[]=y` by default. The backend (Fastify) needs to accept this format, or configure Axios to use comma-separated values. Simplest approach — pass arrays directly and rely on Fastify's default query string parsing which supports repeated params.

---

## Step 6 — Store: `src/stores/onpremStore.ts`

### Update `OnpremFilters` interface

```ts
interface OnpremFilters {
  search: string;
  clientStatus: ClientStatus | '';
  environmentType: EnvironmentType | '';
  appknoxVersions: string[];   // was: appknoxVersion: string
  csmIds: string[];            // new
}
```

### Update `initialFilters`

```ts
const initialFilters: OnpremFilters = {
  search: '',
  clientStatus: '',
  environmentType: '',
  appknoxVersions: [],
  csmIds: [],
};
```

### Update `fetchDeployments`

```ts
// Remove:
if (filters.appknoxVersion) params.currentVersion = filters.appknoxVersion;

// Add:
if (filters.appknoxVersions.length > 0) params.currentVersions = filters.appknoxVersions;
if (filters.csmIds.length > 0) params.csmIds = filters.csmIds;
```

### Update `hasActiveFilters` check (used in `clearFilters`)

Any place that checks for active filters needs to account for array values:
```ts
// In OnpremFilters.tsx:
const hasActiveFilters =
  filters.search ||
  filters.clientStatus ||
  filters.environmentType ||
  filters.appknoxVersions.length > 0 ||
  filters.csmIds.length > 0;
```

---

## Step 7 — UI: `src/components/onprem/OnpremFilters.tsx`

### 7a — Remove Export button

Remove these lines entirely (lines 90–93):
```tsx
<Button variant="outline" size="sm">
  <Download className="h-4 w-4 mr-1" />
  Export
</Button>
```
Also remove `Download` from the lucide-react import.

### 7b — Remove the unused Filter button too (placeholder only)

Remove:
```tsx
<Button variant="outline" size="sm">
  <Filter className="h-4 w-4 mr-1" />
  Filter
</Button>
```
Also remove `Filter` from the lucide-react import and the wrapping `<div className="flex gap-2 ml-auto">` if it becomes empty.

### 7c — Replace version `<Select>` with `<MultiSelect>`

**Add import:**
```ts
import { MultiSelect } from '@/components/ui';
```

**Replace:**
```tsx
// Remove:
const [versionOptions, setVersionOptions] = useState<{ value: string; label: string }[]>([...]);

// Add:
const [versionOptions, setVersionOptions] = useState<{ value: string; label: string }[]>([]);
```

**Replace the version `<Select>` JSX (line 70–76):**
```tsx
<div className="w-52">
  <MultiSelect
    options={versionOptions}
    selected={filters.appknoxVersions}
    onChange={(vals) => setFilters({ appknoxVersions: vals })}
    placeholder="All Versions"
  />
</div>
```

### 7d — Add CSM multi-select

**Fetch CSM users on mount** (alongside the versions fetch):
```ts
const [csmOptions, setCsmOptions] = useState<{ value: string; label: string }[]>([]);

useEffect(() => {
  onpremApi.getDistinctCsmUsers().then((users) => {
    setCsmOptions(
      users.map((u) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName}`,
      }))
    );
  });
}, []);
```

**Add CSM `<MultiSelect>` in JSX** (after the Environment dropdown):
```tsx
<div className="w-52">
  <MultiSelect
    options={csmOptions}
    selected={filters.csmIds}
    onChange={(vals) => setFilters({ csmIds: vals })}
    placeholder="All CSMs"
  />
</div>
```

---

## Implementation Order

1. **Backend first:**
   - Add `getDistinctCsmUsers()` to service + controller + route
   - Add `inArray` support for `currentVersions` and `csmIds` in `listOnprem()`
2. **Frontend types + API:**
   - Update `ListOnpremParams`
   - Add `getDistinctCsmUsers()` to `onprem.ts`
3. **UI component:**
   - Build `MultiSelect` component + export
4. **Store:**
   - Update `OnpremFilters` interface, `initialFilters`, `fetchDeployments`
5. **Filter bar:**
   - Remove Export + Filter buttons, swap selects for multi-selects, add CSM filter

---

## Final Filter Bar State

| Filter | Type | Before | After |
|--------|------|--------|-------|
| Search | Text input | ✅ unchanged | ✅ unchanged |
| Client Status | Single select | ✅ unchanged | ✅ unchanged |
| Environment | Single select | ✅ unchanged | ✅ unchanged |
| Appknox Version | Single select | ✅ | ⇒ **Multi-select** |
| CSM User | — | ❌ not present | ⇒ **Multi-select** (new) |
| Filter button | Placeholder button | present | **removed** |
| Export button | Placeholder button | present | **removed** |

---

## Completion Log

### ✅ Completed on 2026-03-15

All filter overhaul features have been successfully implemented:

**Backend Implementation:**
- ✅ Added `getDistinctCsmUsers()` function to `onprem.service.ts`
- ✅ Added controller handler `getDistinctCsmUsersHandler`
- ✅ Added route `/distinct-csm-users` with authentication and authorization
- ✅ Updated `listOnprem()` to support `currentVersions[]` and `csmIds[]` array filters
- ✅ Updated schema to handle array parameters for multi-select filters

**Frontend UI Component:**
- ✅ Created reusable `MultiSelect` component in `src/components/ui/MultiSelect.tsx`
- ✅ Exported from `src/components/ui/index.ts`
- ✅ Supports checkboxes, click-outside detection, and custom placeholders

**Frontend Types & API:**
- ✅ Updated `ListOnpremParams` interface to support `currentVersions[]` and `csmIds[]`
- ✅ Added `getDistinctCsmUsers()` function to `onprem.ts` API client
- ✅ Support for array parameter serialization (Fastify handles repeated query params)

**Frontend Store:**
- ✅ Updated `OnpremFilters` interface: `appknoxVersion` → `appknoxVersions[]`, added `csmIds[]`
- ✅ Updated `initialFilters` with empty arrays
- ✅ Updated `fetchDeployments()` to map new array filters to API params

**Frontend Filter Component:**
- ✅ Removed Export button
- ✅ Removed Filter placeholder button
- ✅ Replaced version `<Select>` with `<MultiSelect>` for `appknoxVersions`
- ✅ Added new CSM `<MultiSelect>` for `csmIds`
- ✅ Updated `hasActiveFilters` logic for array-based checks
- ✅ Fetches both distinct versions and CSM users on component mount

**Result:**
Users can now filter on-prem deployments by multiple versions and multiple CSM users simultaneously. The filter bar is cleaner with Export and placeholder buttons removed. All filters operate at the API level with proper pagination support.

---

---

# Implementation Plan: Google OIDC SSO Login

**STATUS:** ✅ COMPLETED (2026-03-16)

**Location:** Backend — `/Users/appknox/Documents/projects/knoxadmin-workplace/knoxadmin` + Frontend — `/Users/appknox/Documents/projects/knoxadmin-workplace/knoxadmin-client`

## Overview

Add Google SSO login via OpenID Connect (OIDC) authorization code flow. Users click "Sign in with Google" on the login page, get redirected to Google, Google calls back the backend, and the backend issues JWT tokens identical to the password login flow. No new npm packages. Only users already in the database (matched by email) can log in via SSO.

---

## Environment Variables

From `.env.example` (already added by user):

```env
OIDC_CLIENT_ID=<google-client-id>
OIDC_CLIENT_SECRET=<google-client-secret>
OIDC_ISSUER=https://accounts.google.com
OIDC_CALLBACK_URL=http://localhost:3000/auth/oidc/callback
```

> ⚠️ **Path mismatch to fix:** The backend auth routes are registered under prefix `/api/auth`, so the actual callback URL the backend serves will be `http://localhost:3000/api/auth/oidc/callback`. The `OIDC_CALLBACK_URL` value AND the redirect URI configured in Google Cloud Console must both be updated to `http://localhost:3000/api/auth/oidc/callback`. The frontend Vite dev server uses port 5173, not 3000 — Google should redirect to the **backend** (port 3000), not the frontend.

---

## Files to Modify/Create

### Backend
| File | Change |
|------|--------|
| `src/config/env.ts` | Add `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_ISSUER`, `OIDC_CALLBACK_URL` to Zod env schema |
| `src/modules/auth/auth.routes.ts` | Register two new routes: `GET /oidc` and `GET /oidc/callback` |
| `src/modules/auth/auth.controller.ts` | Add `oidcInitiate()` and `oidcCallback()` handlers |
| `src/modules/auth/auth.service.ts` | Add `exchangeOidcCode()` and `getUserInfoFromGoogle()` helpers |

### Frontend
| File | Change |
|------|--------|
| `src/pages/auth/LoginPage.tsx` | Add "Sign in with Google" button that navigates to `GET /api/auth/oidc` |

> **No changes needed to `AuthCallback.tsx`** — it already reads `accessToken` and `refreshToken` from the URL hash fragment, stores them, and redirects to `/devices`.

---

## OIDC Flow

```
1. User clicks "Sign in with Google" on LoginPage
        ↓
2. Browser navigates to GET /api/auth/oidc (backend)
        ↓
3. Backend builds Google authorization URL with scopes (openid, email, profile)
   and redirects browser to accounts.google.com
        ↓
4. User consents on Google's page
        ↓
5. Google redirects to GET /api/auth/oidc/callback?code=...&state=...
        ↓
6. Backend exchanges code for tokens using Google's token endpoint
        ↓
7. Backend verifies ID token, extracts email
        ↓
8. Backend looks up user by email — if not found, returns 401
        ↓
9. Backend issues JWT access + refresh tokens (same as password login)
        ↓
10. Backend redirects to: http://localhost:5173/auth/callback#accessToken=...&refreshToken=...
        ↓
11. AuthCallback.tsx reads tokens from hash, stores in Zustand, navigates to /devices
```

---

## Step 1 — Backend: Add OIDC Env Vars to Schema

**File:** `src/config/env.ts`

Read the current Zod schema and add these four optional-with-default vars after the existing vars:

```ts
OIDC_CLIENT_ID: z.string().min(1),
OIDC_CLIENT_SECRET: z.string().min(1),
OIDC_ISSUER: z.string().url().default('https://accounts.google.com'),
OIDC_CALLBACK_URL: z.string().url(),
```

> If OIDC should be optional (not all deployments use SSO), wrap each in `.optional()`. Otherwise leave them required and ensure `.env` always has them.

---

## Step 2 — Backend: Auth Service Helpers

**File:** `src/modules/auth/auth.service.ts`

### 2a — `getOidcAuthUrl()`

Builds the Google authorization URL to redirect the user to:

```ts
export function getOidcAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: env.OIDC_CLIENT_ID,
    redirect_uri: env.OIDC_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
```

### 2b — `exchangeOidcCode(code: string)`

Exchanges the authorization code for tokens at Google's token endpoint:

```ts
export async function exchangeOidcCode(code: string): Promise<{ email: string; name: string }> {
  // POST to https://oauth2.googleapis.com/token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.OIDC_CLIENT_ID,
      client_secret: env.OIDC_CLIENT_SECRET,
      redirect_uri: env.OIDC_CALLBACK_URL,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    throw new Error('Failed to exchange OIDC code');
  }

  const tokenData = await tokenRes.json();
  const idToken: string = tokenData.id_token;

  // Decode JWT payload (no signature verification needed — Google's token endpoint is trusted)
  const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString());

  if (!payload.email || !payload.email_verified) {
    throw new Error('OIDC: email not present or not verified');
  }

  return {
    email: payload.email as string,
    name: (payload.name ?? payload.email) as string,
  };
}
```

> We trust the token endpoint response directly — no need to fetch Google's JWKS and verify the JWT signature, since the token came over HTTPS from Google's server.

### 2c — Update `loginUser()` or create separate `loginUserByEmail()`

Add a helper that finds a user by email and generates JWT tokens (reuse existing JWT signing logic):

```ts
export async function loginUserByEmail(email: string): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
  const user = await getUserByEmail(email);   // already exists in auth.service.ts
  if (!user) {
    throw new UnauthorizedError('No account found for this Google email. Contact your administrator.');
  }

  // Reuse existing token generation — same as password login
  const { accessToken, refreshToken } = await generateTokens(user);
  return { accessToken, refreshToken, user: toSafeUser(user) };
}
```

> `getUserByEmail`, `generateTokens`, and `toSafeUser` are assumed to already exist (used by the password login flow). Check the current `auth.service.ts` for exact function names and adjust accordingly.

---

## Step 3 — Backend: Auth Controller Handlers

**File:** `src/modules/auth/auth.controller.ts`

### 3a — `oidcInitiate()`

```ts
export async function oidcInitiate(request: FastifyRequest, reply: FastifyReply) {
  const url = getOidcAuthUrl();
  return reply.redirect(url);
}
```

### 3b — `oidcCallback()`

```ts
export async function oidcCallback(request: FastifyRequest, reply: FastifyReply) {
  const { code, error } = request.query as { code?: string; error?: string };

  if (error || !code) {
    // Google rejected or user cancelled — redirect to login with error flag
    return reply.redirect(`${env.FRONTEND_URL}/login?error=oidc_failed`);
  }

  try {
    const { email } = await exchangeOidcCode(code);
    const { accessToken, refreshToken } = await loginUserByEmail(email);

    // Redirect to frontend AuthCallback with tokens in hash (same pattern as existing auth flow)
    const redirectUrl = `${env.FRONTEND_URL}/auth/callback#accessToken=${accessToken}&refreshToken=${refreshToken}`;
    return reply.redirect(redirectUrl);
  } catch {
    return reply.redirect(`${env.FRONTEND_URL}/login?error=oidc_unauthorized`);
  }
}
```

---

## Step 4 — Backend: Register Routes

**File:** `src/modules/auth/auth.routes.ts`

Add two new routes (no authentication middleware — these are public):

```ts
// Initiate OIDC login — redirects to Google
app.get('/oidc', {
  schema: {
    tags: ['Auth'],
    summary: 'Initiate Google OIDC SSO login',
  },
  handler: oidcInitiate,
});

// OIDC callback — Google redirects here with authorization code
app.get('/oidc/callback', {
  schema: {
    tags: ['Auth'],
    summary: 'Google OIDC SSO callback',
    querystring: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        state: { type: 'string' },
        error: { type: 'string' },
      },
    },
  },
  handler: oidcCallback,
});
```

> These are mounted under `/api/auth` prefix, so the full URLs are `/api/auth/oidc` and `/api/auth/oidc/callback`.

---

## Step 5 — Frontend: Add Google SSO Button to LoginPage

**File:** `src/pages/auth/LoginPage.tsx`

### 5a — Add divider and button below the existing login form submit button

```tsx
{/* Divider */}
<div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-200" />
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="bg-white px-2 text-gray-500">or</span>
  </div>
</div>

{/* Google SSO Button */}
<a
  href={`${import.meta.env.VITE_API_URL}/auth/oidc`}
  className="flex items-center justify-center gap-3 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
>
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
  Sign in with Google
</a>
```

> Uses an `<a href>` tag (not `<button onClick>`) because the browser needs to do a full navigation to the backend URL — it's not an AJAX call.

> `VITE_API_URL` should already be defined in `.env` (e.g. `VITE_API_URL=http://localhost:3000/api`). The link resolves to `http://localhost:3000/api/auth/oidc`.

### 5b — Handle error query param from failed SSO

After a failed SSO attempt, the backend redirects to `/login?error=oidc_failed` or `?error=oidc_unauthorized`. Show an error message:

```tsx
// Near the top of LoginPage component, after existing hooks:
const [searchParams] = useSearchParams();
const oidcError = searchParams.get('error');

// In JSX, above the form or at the top of the card:
{oidcError && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
    {oidcError === 'oidc_unauthorized'
      ? 'No account found for this Google address. Contact your administrator.'
      : 'Google sign-in failed. Please try again or use email/password.'}
  </div>
)}
```

Add `useSearchParams` to the `react-router-dom` import.

---

## Step 6 — Google Cloud Console Configuration

> This is a manual step performed in the Google Cloud Console by the developer — not a code change.

1. Go to **APIs & Services > Credentials** in Google Cloud Console
2. Open the OAuth 2.0 Client ID used for this project
3. Under **Authorized redirect URIs**, ensure `http://localhost:3000/api/auth/oidc/callback` is listed
4. Remove `http://localhost:3000/auth/oidc/callback` (without `/api` prefix) if it was previously added
5. For production, add the production callback URL: `https://<your-domain>/api/auth/oidc/callback`

---

## Implementation Order

1. **Backend env schema** (`src/config/env.ts`) — ensures app fails fast if OIDC vars missing
2. **Backend service** (`auth.service.ts`) — `getOidcAuthUrl()`, `exchangeOidcCode()`, `loginUserByEmail()`
3. **Backend controller** (`auth.controller.ts`) — `oidcInitiate()`, `oidcCallback()`
4. **Backend routes** (`auth.routes.ts`) — register `/oidc` and `/oidc/callback`
5. **Frontend** (`LoginPage.tsx`) — add Google button + OIDC error message
6. **Google Cloud Console** — update redirect URI (manual)

---

## Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| JWT signature verification | Skip (trust token endpoint) | ID token came over HTTPS directly from Google |
| User provisioning | Pre-existing users only | Admin controls who can access; SSO is login-only |
| New npm packages | None | `fetch` (Node 18+) handles HTTP; JWT decode is one line |
| Token passing to frontend | URL hash fragment | Matches existing `AuthCallback.tsx` pattern |
| Failed SSO redirect | `/login?error=oidc_*` | Shows user-friendly error on login page |
| OIDC state parameter | Not implemented (MVP) | Optional CSRF protection — add in future if needed |

---

## Completion Log

### ✅ Completed on 2026-03-16

All OIDC SSO implementation steps have been successfully completed:

**Backend Implementation:**
- ✅ Added OIDC env vars to `src/config/env.ts` (OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_ISSUER, OIDC_CALLBACK_URL)
- ✅ Added `getOidcAuthUrl()` function to `src/modules/auth/auth.service.ts`
- ✅ Added `exchangeOidcCode(code)` function to decode and extract email from Google's ID token
- ✅ Added `validateOidcUser(email)` function to find user and validate account status
- ✅ Added `oidcInitiate()` handler in `src/modules/auth/auth.controller.ts` to redirect to Google
- ✅ Added `oidcCallback()` handler in `src/modules/auth/auth.controller.ts` to exchange code and generate tokens
- ✅ Registered `/oidc` and `/oidc/callback` routes in `src/modules/auth/auth.routes.ts`
- ✅ Updated `.env` with OIDC credentials (with corrected callback URL: `/api/auth/oidc/callback`)
- ✅ Updated `.env.example` with placeholder OIDC vars and correct callback URL

**Frontend Implementation:**
- ✅ Updated `src/pages/auth/LoginPage.tsx` to import `useSearchParams` from react-router-dom
- ✅ Added OIDC error handling to display user-friendly error messages
- ✅ Updated Google SSO button to navigate to `GET /api/auth/oidc` endpoint
- ✅ Button uses `<a>` tag for full-page navigation (not AJAX)

**Environment Setup:**
- ✅ OIDC_CALLBACK_URL correctly set to `http://localhost:3000/api/auth/oidc/callback` (includes /api prefix)
- ✅ Google OAuth client credentials configured in .env

**Notes:**
- OIDC flow follows the authorization code flow pattern
- Pre-existing users only — no automatic provisioning from Google
- JWT tokens generated by backend identical to password login flow
- AuthCallback.tsx already handles hash fragment tokens correctly
- Ready for Google Cloud Console OAuth configuration (manual step)

---

---

# Implementation Plan: Settings Page, User Invitations via SSO & Password Login Toggle

**STATUS:** 🔲 PENDING

**Location:** Frontend — `knoxadmin-client` + Backend — `knoxadmin`

## Overview

Four related changes:
1. **Settings page** — Move Users management under a `/settings` page with a sub-tab layout
2. **User invitation emails** — Keep the existing invite flow; fix a URL bug in invite emails; update UI links to new routes
3. **SSO-based invite acceptance** — Replace the password-set form with a Google SSO sign-in button; OIDC callback auto-accepts pending invites on first Google login
4. **Disable password login** — An env var toggle to hide/block email+password login and show SSO-only mode

---

## Background: What Already Exists

| Feature | Status |
|---------|--------|
| Invite creation (`POST /api/invites`) | ✅ exists |
| Invite email sending (`sendInviteEmail`) | ✅ exists (nodemailer) |
| Invite token validation (`GET /api/invites/:token`) | ✅ exists |
| Invite acceptance with password (`POST /api/invites/:token/accept`) | ✅ exists (needs SSO variant) |
| `AcceptInvitePage.tsx` (password form) | ✅ exists (to be replaced with SSO button) |
| `AddUserPage.tsx` (sends invite) | ✅ exists (just move to settings routes) |
| SMTP configured (nodemailer) | ✅ configured via env vars |
| Google OIDC login | ✅ planned (previous plan) |

> ⚠️ **Known URL bug:** `sendInviteEmail()` generates link `{FRONTEND_URL}/invite/accept?token=...` (query param) but `AcceptInvitePage` is mounted at `/accept-invite/:token` (path param). These don't match — this must be fixed as part of this plan.

---

## Files to Modify/Create

### Frontend
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/settings` nested routes, remove standalone `/users` routes |
| `src/components/layout/Navbar.tsx` | Remove `Users` link; scope `Settings` to admin only |
| `src/pages/settings/SettingsPage.tsx` | **New** — settings shell with sub-tab navigation |
| `src/pages/users/UserListPage.tsx` | Update "Add New User" link to `/settings/users/add` |
| `src/pages/users/AddUserPage.tsx` | Update back-link/navigate to `/settings/users` |
| `src/pages/users/EditUserPage.tsx` | Update back-link to `/settings/users` |
| `src/pages/auth/AcceptInvitePage.tsx` | Replace password form with Google SSO button |
| `src/pages/auth/LoginPage.tsx` | Conditionally hide password form based on env var |

### Backend
| File | Change |
|------|--------|
| `src/services/email.service.ts` | Fix invite URL bug (query param → path param) |
| `src/modules/invites/invites.service.ts` | Add `acceptInviteViaSso()` (no-password variant) |
| `src/modules/auth/auth.service.ts` | Update `loginUserByEmail()` to auto-accept pending invites |
| `src/db/schema/users.ts` | Make `passwordHash` nullable (if currently `notNull()`) |
| `drizzle/` | New migration: `ALTER COLUMN password_hash DROP NOT NULL` |
| `src/config/env.ts` | Add `ENABLE_PASSWORD_LOGIN` boolean env var |
| `src/modules/auth/auth.routes.ts` | Guard login/forgot-password routes with env var check |

---

## Part 1 — Settings Page with Users Sub-tab

### 1a — New `SettingsPage` Component

**File:** `src/pages/settings/SettingsPage.tsx` (new file)

A page shell with horizontal sub-tab navigation. Currently one tab: Users. More tabs (General, Integrations) can be added later.

```tsx
import { NavLink, Outlet, Navigate } from 'react-router-dom';

const tabs = [
  { path: '/settings/users', label: 'Users' },
];

const SettingsPage = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
    </div>
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex gap-4">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `pb-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
    <Outlet />
  </div>
);

export { SettingsPage };
```

Create `src/pages/settings/index.ts` to export it.

### 1b — Update `src/App.tsx`

```tsx
// Remove:
<Route path="/users" element={<UserListPage />} />
<Route path="/users/add" element={<AddUserPage />} />
<Route path="/users/:id/edit" element={<EditUserPage />} />

// Add (nested under AppLayout):
import { SettingsPage } from '@/pages/settings';

<Route path="/settings" element={<SettingsPage />}>
  <Route index element={<Navigate to="/settings/users" replace />} />
  <Route path="users" element={<UserListPage />} />
  <Route path="users/add" element={<AddUserPage />} />
  <Route path="users/:id/edit" element={<EditUserPage />} />
</Route>
```

### 1c — Update `Navbar.tsx`

```ts
// Remove the standalone Users link:
...(user?.role === 'admin' ? [{ path: '/users', label: 'Users' }] : []),

// Make Settings admin-only (currently visible to everyone):
// Change from:
{ path: '/settings', label: 'Settings' },
// To (inside the admin check):
...(user?.role === 'admin' ? [{ path: '/settings', label: 'Settings' }] : []),
```

### 1d — Update Back-links in User Pages

**`AddUserPage.tsx`:**
```tsx
// Link to="/users" → to="/settings/users"
// navigate('/users') → navigate('/settings/users')
```

**`EditUserPage.tsx`:**
```tsx
// Link to="/users" → to="/settings/users"
```

**`UserListPage.tsx`:**
```tsx
// Link to="/users/add" → to="/settings/users/add"
```

---

## Part 2 — Fix Invite Email URL Bug

**File:** `src/services/email.service.ts` (backend, line 51)

```ts
// Current (broken — links to non-existent /invite/accept?token= route):
const inviteUrl = `${env.FRONTEND_URL}/invite/accept?token=${inviteToken}`;

// Fix (matches actual frontend route /accept-invite/:token):
const inviteUrl = `${env.FRONTEND_URL}/accept-invite/${inviteToken}`;
```

No route changes needed — `AcceptInvitePage` already uses `useParams<{ token: string }>()`.

---

## Part 3 — SSO-Based Invite Acceptance

### New Invite Accept Flow

```
1. Admin sends invite → invite record in DB (pending, with token + email)
2. User receives email → clicks link → /accept-invite/{token}
3. AcceptInvitePage validates token → shows user info
4. User clicks "Sign in with Google to accept invitation"
5. Browser navigates to GET /api/auth/oidc (OIDC initiate)
6. Google OAuth completes → GET /api/auth/oidc/callback?code=...
7. Backend extracts email from Google ID token
8. Backend: user exists? → normal login
   Backend: user missing, pending invite with same email? → create user (no password), accept invite → login
   Backend: neither? → redirect to /login?error=oidc_unauthorized
9. JWT tokens issued → redirect to /auth/callback#accessToken=...&refreshToken=...
10. AuthCallback.tsx stores tokens → navigate to /devices
```

No invite token needs to pass through the OIDC flow — matching happens by email.

### 3a — Schema: Make `passwordHash` Nullable

**File:** `src/db/schema/users.ts`

Check if `passwordHash` is currently `.notNull()`. If so:
```ts
// Change from:
passwordHash: text('password_hash').notNull(),
// To:
passwordHash: text('password_hash'),
```

**New migration file** (e.g. `drizzle/0007_nullable_password_hash.sql`):
```sql
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
```

Also update the `POST /api/auth/login` handler to guard against null hash:
```ts
if (!user.passwordHash) {
  throw new UnauthorizedError('This account uses SSO. Please sign in with Google.');
}
```

### 3b — Backend: Add `acceptInviteViaSso()` to `invites.service.ts`

```ts
export async function acceptInviteViaSso(email: string): Promise<void> {
  const invite = await db.query.userInvites.findFirst({
    where: and(
      eq(userInvites.email, email.toLowerCase()),
      eq(userInvites.status, 'pending'),
      gt(userInvites.expiresAt, new Date())
    ),
  });

  if (!invite) return; // no pending invite — caller decides what to do

  // Create user without password hash (SSO-only account)
  await db.insert(users).values({
    email: invite.email,
    passwordHash: null,
    firstName: invite.firstName,
    lastName: invite.lastName,
    role: invite.role,
    isActive: true,
    inviteStatus: 'accepted',
    invitedBy: invite.invitedBy,
  });

  await db
    .update(userInvites)
    .set({ status: 'accepted', acceptedAt: new Date(), updatedAt: new Date() })
    .where(eq(userInvites.id, invite.id));
}

export async function getPendingInviteByEmail(email: string): Promise<UserInvite | null> {
  return db.query.userInvites.findFirst({
    where: and(
      eq(userInvites.email, email.toLowerCase()),
      eq(userInvites.status, 'pending'),
      gt(userInvites.expiresAt, new Date())
    ),
  }) ?? null;
}
```

### 3c — Backend: Update `loginUserByEmail()` in `auth.service.ts`

```ts
import { acceptInviteViaSso, getPendingInviteByEmail } from '../invites/invites.service.js';

export async function loginUserByEmail(
  email: string
): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
  let user = await getUserByEmail(email);

  if (!user) {
    // Check for pending invite — auto-accept on first SSO login
    const invite = await getPendingInviteByEmail(email);
    if (!invite) {
      throw new UnauthorizedError('No account found for this Google email. Contact your administrator.');
    }
    await acceptInviteViaSso(email);
    user = await getUserByEmail(email); // now exists
  }

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Account is inactive. Contact your administrator.');
  }

  const { accessToken, refreshToken } = await generateTokens(user);
  return { accessToken, refreshToken, user: toSafeUser(user) };
}
```

### 3d — Frontend: Replace Password Form in `AcceptInvitePage.tsx`

Remove the entire `useForm` setup, Zod schema, `onSubmit` handler, and password fields. Replace the `valid` state JSX with:

```tsx
// 'valid' state — show SSO accept button instead of password form:
return (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="flex justify-center">
        <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">AK</span>
        </div>
      </div>
      <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
        Accept Your Invitation
      </h2>
    </div>
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <Card>
        <CardBody>
          {inviteDetails && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Welcome, <span className="font-semibold">{inviteDetails.firstName} {inviteDetails.lastName}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">{inviteDetails.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Invited as: <span className="font-medium">{inviteDetails.role.replace('_', ' ')}</span>
              </p>
            </div>
          )}
          <p className="text-sm text-gray-600 mb-4">
            Sign in with your Google account to accept this invitation and activate your account.
          </p>
          <a
            href={`${import.meta.env.VITE_API_URL}/auth/oidc`}
            className="flex items-center justify-center gap-3 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            {/* Google SVG icon (same as LoginPage) */}
            Sign in with Google to Accept Invitation
          </a>
          <p className="mt-3 text-xs text-gray-400 text-center">
            Use the Google account for <strong>{inviteDetails?.email}</strong>
          </p>
        </CardBody>
      </Card>
    </div>
  </div>
);
```

Also update the `success` state message (currently says "sign in with email and password"):
```tsx
// Change:
"Your account has been set up. You can now sign in with your email and password."
// To:
"Your account has been activated. You can now sign in with Google."
```

Remove unused imports: `Lock`, `Eye`, `EyeOff`, `useForm`, `zodResolver`, `z`.

---

## Part 4 — Password Login Toggle

### 4a — Backend: Add `ENABLE_PASSWORD_LOGIN` Env Var

**File:** `src/config/env.ts`

```ts
ENABLE_PASSWORD_LOGIN: z
  .string()
  .transform((v) => v !== 'false')
  .default('true'),
```

**`.env.example`:**
```env
# Set to false for SSO-only mode (hides password login on frontend, blocks it on backend)
ENABLE_PASSWORD_LOGIN=false
```

### 4b — Backend: Guard Password Routes

**File:** `src/modules/auth/auth.routes.ts`

Add an early check in the `POST /login` handler:

```ts
if (!env.ENABLE_PASSWORD_LOGIN) {
  return reply.status(403).send({
    error: 'Password login is disabled. Please use Google SSO.',
  });
}
```

Apply the same guard to:
- `POST /forgot-password`
- `GET /reset-password/:token`
- `POST /reset-password/:token`

Also add a null-hash guard in the login handler (for SSO-only accounts trying password login):
```ts
if (!user.passwordHash) {
  return reply.status(403).send({ error: 'This account uses SSO. Please sign in with Google.' });
}
```

### 4c — Frontend: Add `VITE_ENABLE_PASSWORD_LOGIN` Env Var

**`.env` / `.env.example` (client):**
```env
VITE_ENABLE_PASSWORD_LOGIN=false
```

### 4d — Frontend: Conditionally Show Password Form in `LoginPage.tsx`

```tsx
const passwordLoginEnabled = import.meta.env.VITE_ENABLE_PASSWORD_LOGIN !== 'false';

// Wrap existing email/password form:
{passwordLoginEnabled && (
  <>
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* existing email + password inputs */}
      {/* existing forgot password link */}
      {/* existing submit button */}
    </form>
    {/* Divider between form and Google button */}
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white px-2 text-gray-500">or</span>
      </div>
    </div>
  </>
)}

{/* Google SSO button — always shown */}
<a href={`${import.meta.env.VITE_API_URL}/auth/oidc`} ...>
  Sign in with Google
</a>
```

When `VITE_ENABLE_PASSWORD_LOGIN=false`: only the Google SSO button is visible on the login page.

---

## Implementation Order

1. **Fix invite email URL bug** (`email.service.ts`) — one-line fix, high impact
2. **Schema + migration** — make `passwordHash` nullable if needed
3. **`acceptInviteViaSso()` + `getPendingInviteByEmail()`** (`invites.service.ts`)
4. **Update `loginUserByEmail()`** (`auth.service.ts`) — auto-accept pending invites
5. **Backend env var + route guards** (`env.ts` + `auth.routes.ts`)
6. **`SettingsPage`** + `App.tsx` routes + Navbar update
7. **User page back-links** (AddUserPage, EditUserPage, UserListPage)
8. **`AcceptInvitePage.tsx`** — replace password form with SSO button
9. **`LoginPage.tsx`** — conditional password form

---

## Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Invite token through OIDC flow | Not passed | Backend matches pending invite by Google email — simpler, no sessionStorage |
| `passwordHash` for SSO users | `null` | No password needed; guards prevent password-based login |
| `ENABLE_PASSWORD_LOGIN` default | `true` | Safe default — existing deployments not broken |
| Settings page visibility | Admin only | Contains user management — same as the old `/users` route |
| Back navigation after settings move | `/settings/users` | Consistent with new route structure |