import { Queue } from "bullmq";

const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };

export const emailQueue     = new Queue("email",              { connection } as any);
export const vpsQueue       = new Queue("vps-provision",      { connection } as any);
export const hostingQueue   = new Queue("hosting-provision",  { connection } as any);
export const renewQueue     = new Queue("auto-renew",         { connection } as any);
export const notifQueue     = new Queue("notifications",      { connection } as any);

export async function queueEmail(to: string, subject: string, html: string) {
  await emailQueue.add("send", { to, subject, html }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
}
export async function queueVpsProvision(orderId: string) {
  await vpsQueue.add("provision", { orderId }, { attempts: 3, backoff: { type: "exponential", delay: 10000 } });
}
export async function queueHostingProvision(orderId: string) {
  await hostingQueue.add("provision", { orderId }, { attempts: 3, backoff: { type: "exponential", delay: 10000 } });
}
export async function scheduleAutoRenew(orderId: string, type: "vps" | "hosting", renewAt: Date) {
  await renewQueue.add("renew", { orderId, type }, { delay: renewAt.getTime() - Date.now(), jobId: `renew-${type}-${orderId}` });
}
