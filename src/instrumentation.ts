export async function register() {
  // Chỉ chạy server-side
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startLicenseScheduler } = await import("./lib/license/scheduler");
    startLicenseScheduler();
  }
}
