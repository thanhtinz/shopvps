import { Worker, Queue, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { cronMatches } from "@/lib/cron";

const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };

export const cronjobQueue = new Queue("cronjob-runner", { connection } as any);

export const cronjobWorker = new Worker("cronjob-runner", async (_job: Job) => {
  await runDueCronjobs();
}, { connection: connection as any });

cronjobWorker.on("failed", (job, err) => {
  console.error(`[Cronjob Worker] Job ${job?.id} failed:`, err.message);
});

// Tick every minute.
cronjobQueue.add("tick", {}, { repeat: { every: 60_000 } }).catch(() => {});

async function runDueCronjobs() {
  const now = new Date();
  const jobs = await prisma.cronjob.findMany({
    where: { isActive: true, order: { status: "ACTIVE", category: "cronjob" } },
  });

  for (const job of jobs) {
    if (!cronMatches(job.schedule, now)) continue;
    // Guard against double-firing inside the same minute.
    if (job.lastRunAt && now.getTime() - new Date(job.lastRunAt).getTime() < 55_000) continue;

    let status = "";
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30_000);
    try {
      const res = await fetch(job.url, { method: job.method, signal: ctrl.signal, redirect: "follow" });
      status = String(res.status);
    } catch (e: any) {
      status = `ERR: ${(e?.message || "failed").slice(0, 80)}`;
    } finally {
      clearTimeout(timer);
    }
    await prisma.cronjob.update({ where: { id: job.id }, data: { lastRunAt: now, lastStatus: status } });
  }
}
