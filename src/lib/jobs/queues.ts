import { Queue, Worker } from "bullmq";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

// Queues
export const emailQueue = new Queue("email", { connection: redis });
export const vpsQueue = new Queue("vps", { connection: redis });
export const renewalQueue = new Queue("renewal", { connection: redis });
export const notificationQueue = new Queue("notification", { connection: redis });

// Job types
export type EmailJobData = {
  type: "verify" | "reset-password" | "vps-created" | "invoice" | "marketing";
  to: string;
  payload: Record<string, unknown>;
};

export type VpsJobData = {
  type: "create" | "delete" | "suspend" | "rebuild";
  vpsOrderId: string;
  payload?: Record<string, unknown>;
};

export type RenewalJobData = {
  type: "check-expiring" | "auto-renew";
  orderId?: string;
  orderType?: "vps" | "hosting";
};

// Schedule recurring jobs
export async function scheduleRecurringJobs(): Promise<void> {
  // Check expiring services every day at 8am
  await renewalQueue.add(
    "check-expiring",
    { type: "check-expiring" },
    {
      repeat: { pattern: "0 8 * * *" },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );
}
