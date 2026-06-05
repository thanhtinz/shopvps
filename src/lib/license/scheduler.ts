import { checkAndRefreshLicense } from "./index";

let schedulerStarted = false;
let intervalId: NodeJS.Timeout | null = null;

const VERIFY_INTERVAL = 60 * 60 * 1000; // 1 giờ

export function startLicenseScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  console.log("[License] Scheduler started — verify every 1h");

  // Verify ngay khi start
  runVerify();

  // Verify định kỳ
  intervalId = setInterval(runVerify, VERIFY_INTERVAL);
}

async function runVerify() {
  try {
    const state = await checkAndRefreshLicense();
    console.log(`[License] Status: ${state.status}${state.grace ? " (GRACE)" : ""}`);

    // Cập nhật cookie qua API nội bộ
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/setup/status`, {
      method: "GET",
    }).catch(() => {});
  } catch (err) {
    console.error("[License] Verify error:", err);
  }
}

export function stopLicenseScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    schedulerStarted = false;
  }
}
