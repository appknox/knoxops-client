const AGENT_BASE = 'http://localhost:17392';

export interface IosDetectResult {
  platform: 'ios';
  id: string;
}

export interface IosDeviceInfo {
  platform: 'iOS';
  name: string | null;
  model: string | null;
  osVersion: string | null;
  serialNumber: string | null;
  udid: string | null;
  modelNumber: string | null;
  cpuArch: string | null;
  colour: string | null;
  imei: string | null;
  imei2: string | null;
  macAddress: string | null;
  simNumber: string | null;
  rom: string | null;
}

async function post<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${AGENT_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Agent error: ${res.status}`);
  }
  return data as T;
}

export async function isAgentRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${AGENT_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export const iosAgent = {
  detect: () => post<{ device: IosDetectResult | null }>('/detect'),
  pair: (id: string) => post<{ success: boolean }>('/pair', { id }),
  fetch: (id: string) => post<IosDeviceInfo>('/fetch', { id }),
};
