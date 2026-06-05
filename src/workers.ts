// Entry point for BullMQ workers — run: tsx src/workers.ts
import "./lib/workers/email.worker";
import "./lib/workers/vps.worker";
import "./lib/workers/hosting.worker";
import "./lib/workers/autorenew.worker";
import "./lib/workers/reminder.worker";
import "./lib/workers/billing.worker";

console.log(" Workers started");
console.log("  → Email worker");
console.log("  → VPS provisioning worker");
console.log("  → Hosting provisioning worker");
console.log("  → Auto-renew worker");
console.log("  → Renewal reminder worker");
console.log("  → Billing worker (invoices + dunning)");

// Keep process alive
process.on("SIGTERM", async () => {
  console.log("Workers shutting down...");
  process.exit(0);
});
