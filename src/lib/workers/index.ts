import { Queue } from "bullmq";

// BullMQ producers. Queues are created LAZILY (on first use at runtime) so that
// importing this module — e.g. when Next.js compiles the API routes during
// `next build` — never opens a Redis connection. This keeps the build working
// on platforms (Railway, etc.) where Redis isn't reachable at build time.
const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };
const cache = new Map<string, Queue>();

export function getQueue(name: string): Queue {
  let q = cache.get(name);
  if (!q) {
    q = new Queue(name, { connection } as any);
    cache.set(name, q);
  }
  return q;
}

export async function queueEmail(to: string, subject: string, html: string) {
  await getQueue("email").add("send", { to, subject, html }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
}
export async function queueVpsProvision(orderId: string) {
  await getQueue("vps-provision").add("provision", { orderId }, { attempts: 3, backoff: { type: "exponential", delay: 10000 } });
}
export async function queueHostingProvision(orderId: string) {
  await getQueue("hosting-provision").add("provision", { orderId }, { attempts: 3, backoff: { type: "exponential", delay: 10000 } });
}
export async function scheduleAutoRenew(orderId: string, type: "vps" | "hosting", renewAt: Date) {
  await getQueue("auto-renew").add("renew", { orderId, type }, { delay: renewAt.getTime() - Date.now(), jobId: `renew-${type}-${orderId}` });
}
