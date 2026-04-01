import { Adb, AdbDaemonTransport } from '@yume-chan/adb';
import { AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';

export interface AndroidDeviceInfo {
  platform: 'Android';
  name: string | null;
  model: string | null;
  osVersion: string | null;
  serialNumber: string | null;
  udid: null;
  modelNumber: null;
  cpuArch: string | null;
  colour: null;
  imei: string | null;
  imei2: string | null;
  macAddress: string | null;
  simNumber: string | null;
  rom: string | null;
}

interface AdbPrivateKey {
  buffer: Uint8Array;
  name?: string;
}

// Credential store backed by localStorage so the RSA key persists across sessions.
// The library expects the private key as a raw PKCS#8 DER-encoded Uint8Array.
class LocalStorageCredentialStore {
  private readonly STORAGE_KEY = 'knoxops-adb-key-pkcs8';

  async generateKey(): Promise<AdbPrivateKey> {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-1' },
      true,
      ['sign', 'verify']
    );
    const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const buffer = new Uint8Array(pkcs8);
    // Persist as base64
    localStorage.setItem(this.STORAGE_KEY, btoa(String.fromCharCode(...buffer)));
    return { buffer, name: 'KnoxOps' };
  }

  *iterateKeys(): Iterable<AdbPrivateKey> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return;
    try {
      const binary = atob(stored);
      const buffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
      yield { buffer, name: 'KnoxOps' };
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

export function isWebUsbSupported(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

/**
 * Prompt the user to select an Android device via WebUSB, connect via ADB,
 * run `getprop`, and return device info — all in the browser.
 */
export async function detectAndroidViaWebUsb(): Promise<AndroidDeviceInfo> {
  if (!isWebUsbSupported()) {
    throw new Error('WebUSB is not supported in this browser. Use Chrome or Edge.');
  }

  const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
  if (!manager) {
    throw new Error('WebUSB is not available. Ensure the page is served over HTTPS or localhost.');
  }

  // Step 1: Request USB device (shows browser device picker)
  const device = await manager.requestDevice();
  if (!device) {
    throw new Error('No device selected.');
  }

  // Step 2: Open USB connection then authenticate via ADB (triggers "Allow USB Debugging?" on the device)
  let connection;
  try {
    connection = await device.connect();
  } catch (e: any) {
    if (e?.message?.includes('claimInterface') || e?.message?.includes('Unable to claim')) {
      throw new Error(
        'Unable to claim USB interface. The ADB daemon is likely running on your machine and holding the USB connection.\n\nRun this in your terminal and try again:\n  adb kill-server'
      );
    }
    throw e;
  }
  const credentialStore = new LocalStorageCredentialStore();
  const transport = await AdbDaemonTransport.authenticate({
    serial: device.serial,
    connection,
    credentialStore,
  });

  const adb = new Adb(transport);

  try {
    // Step 3: Run getprop to collect device properties
    const getpropOutput = await adb.subprocess.noneProtocol.spawnWaitText('getprop');
    const info = parseGetprop(getpropOutput);

    // Try to get IMEI via service call (Android 10+)
    try {
      const imeiOut = await adb.subprocess.noneProtocol.spawnWaitText(
        'service call iphonesubinfo 1 s16 com.android.shell'
      );
      info.imei = info.imei ?? parseParcelString(imeiOut);
    } catch { /* telephony not available */ }

    return info;
  } finally {
    await transport.close();
  }
}

function parseGetprop(output: string): AndroidDeviceInfo {
  const props: Record<string, string> = {};
  for (const line of output.split('\n')) {
    const match = line.match(/^\[([^\]]+)\]:\s*\[([^\]]*)\]/);
    if (match) props[match[1]] = match[2];
  }

  const manufacturer = props['ro.product.manufacturer'] ?? '';
  const model = props['ro.product.model'] ?? '';

  const abi = props['ro.product.cpu.abi'] ?? '';
  let cpuArch: string | null = null;
  if (abi.includes('arm64') || abi.includes('aarch64')) cpuArch = 'ARM64';
  else if (abi.includes('x86_64')) cpuArch = 'x86_64';
  else if (abi.includes('armeabi') || abi.includes('arm')) cpuArch = 'ARM';

  return {
    platform: 'Android',
    name: manufacturer && model ? `${manufacturer} ${model}` : model || null,
    model: model || null,
    osVersion: props['ro.build.version.release'] ?? null,
    serialNumber: props['ro.serialno'] ?? null,
    udid: null,
    modelNumber: null,
    cpuArch,
    colour: null,
    imei: props['ro.gsm.imei'] ?? null,
    imei2: props['ro.gsm.imei2'] ?? null,
    macAddress: props['ro.boot.wifimacaddr'] ?? null,
    simNumber: null,
    rom: props['ro.lineage.version'] ?? props['ro.build.display.id'] ?? null,
  };
}

// Parse IMEI from `service call iphonesubinfo` Parcel hex dump
function parseParcelString(output: string, minLen = 14, maxLen = 15): string | null {
  const readable: string[] = [];
  for (const line of output.split('\n')) {
    const m = line.match(/'([^']*)'/);
    if (m) readable.push(m[1]);
  }
  const raw = readable.join('').replace(/\./g, '');
  const match = raw.match(new RegExp(`\\d{${minLen},${maxLen}}`));
  return match ? match[0] : null;
}
