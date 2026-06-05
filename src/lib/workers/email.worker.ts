import { Worker, Job } from "bullmq";
import { sendEmail } from "@/lib/email";

const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };

export const emailWorker = new Worker("email", async (job: Job) => {
  const { to, subject, html } = job.data;
  await sendEmail({ to, subject, html });
  console.log(`[Email Worker] Sent to ${to}`);
}, { connection: connection as any, concurrency: 5 });

emailWorker.on("failed", (job, err) => { console.error(`[Email Worker] Failed:`, err.message); });
