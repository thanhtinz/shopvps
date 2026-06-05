import os from "os";
import crypto from "crypto";

export function getHardwareFingerprint(): string {
  try {
    const cpus = os.cpus();
    const cpuInfo = cpus.length > 0 ? `${cpus[0].model}-${cpus.length}` : "unknown-cpu";

    const interfaces = os.networkInterfaces();
    const macs: string[] = [];
    for (const iface of Object.values(interfaces)) {
      if (!iface) continue;
      for (const addr of iface) {
        if (!addr.internal && addr.mac && addr.mac !== "00:00:00:00:00:00") {
          macs.push(addr.mac);
        }
      }
    }
    macs.sort();
    const macInfo = macs[0] || "unknown-mac";

    const platform = `${os.platform()}-${os.arch()}`;
    const raw = `${cpuInfo}|${macInfo}|${platform}`;

    return crypto.createHash("sha256").update(raw).digest("hex");
  } catch {
    return crypto.createHash("sha256").update("fallback-fingerprint").digest("hex");
  }
}
