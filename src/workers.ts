// Entry point for BullMQ workers — run: tsx src/workers.ts
import "./lib/workers/email.worker";
import "./lib/workers/vps.worker";
import "./lib/workers/autorenew.worker";

console.log(" Workers started");
console.log("  → Email worker");
console.log("  → VPS provisioning worker");
console.log("  → Auto-renew worker");

// Keep process alive
process.on("SIGTERM", async () => {
  console.log("Workers shutting down...");
  process.exit(0);
});
