import { prisma } from "@/lib/prisma";
import { verifyLicense, getCachedRuntimeKey, clearLicenseCache } from "./client";

export type SetupStatus =
  | "NOT_SETUP"        // Chưa setup lần nào
  | "VALID"            // Setup xong, license hợp lệ
  | "INVALID"          // License không hợp lệ
  | "GRACE"            // License server không trả lời nhưng còn grace period
  | "EXPIRED";         // Hết hạn

export interface LicenseState {
  status: SetupStatus;
  domain?: string;
  expiresAt?: string | null;
  reason?: string;
  grace?: boolean;
}

// Check nhanh từ DB — dùng trong middleware (không gọi HTTP)
export async function getSetupStatus(): Promise<SetupStatus> {
  try {
    const setup = await prisma.appSetup.findUnique({
      where: { id: "singleton" },
    });
    if (!setup) return "NOT_SETUP";
    return setup.verifyStatus as SetupStatus;
  } catch {
    return "NOT_SETUP";
  }
}

// Verify đầy đủ với license server — dùng khi startup & background job
export async function checkAndRefreshLicense(): Promise<LicenseState> {
  const setup = await prisma.appSetup.findUnique({
    where: { id: "singleton" },
  });

  if (!setup) return { status: "NOT_SETUP" };

  clearLicenseCache();

  const result = await verifyLicense({
    licenseKey: setup.licenseKey,
    domain: setup.domain,
  });

  const newStatus: SetupStatus = result.valid
    ? "VALID"
    : result.grace
    ? "GRACE"
    : "INVALID";

  // Update DB
  await prisma.appSetup.update({
    where: { id: "singleton" },
    data: {
      verifyStatus: newStatus,
      lastVerifiedAt: new Date(),
      ...(result.runtimeKey && { runtimeKey: result.runtimeKey }),
      ...(result.expiresAt && { expiresAt: new Date(result.expiresAt) }),
    },
  });

  return {
    status: newStatus,
    domain: setup.domain,
    expiresAt: result.expiresAt,
    reason: result.reason,
    grace: result.grace,
  };
}

export { getCachedRuntimeKey, verifyLicense };
export * from "./fingerprint";
