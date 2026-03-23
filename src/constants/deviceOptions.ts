// Shared device options constants used across forms

export const PURPOSE_OPTIONS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Security', label: 'Security' },
  { value: 'Production', label: 'Production' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'onPrem', label: 'On-Prem' },
  { value: 'available', label: 'Available' },
  { value: 'csTeam', label: 'CS Team' },
  { value: 'partner', label: 'Partner' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'staging', label: 'Staging' },
  { value: 'notUsable', label: 'Not Usable' },
  { value: 'toBeRepaired', label: 'To Be Repaired' },
  { value: '__other__', label: 'Other (enter manually)' },
];

export const DEVICE_TYPE_OPTIONS = [
  { value: 'server', label: 'Server' },
  { value: 'workstation', label: 'Workstation' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'iot', label: 'IoT' },
  { value: 'network', label: 'Network' },
  { value: 'charging_hub', label: 'Charging Hub' },
  { value: 'other', label: 'Other' },
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
