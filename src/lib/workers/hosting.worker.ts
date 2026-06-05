import { Worker, Job } from "bullmq";

import { prisma } from "@/lib/prisma";
import { getWHMClient } from "@/lib/whm";
import { decrypt } from "@/lib/encrypt";

const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };

export const hostingWorker = new Worker(
  "hosting-provision",
  async (job: Job) => {
    const { orderId } = job.data;
    console.log(`[Hosting Worker] Provisioning order ${orderId}`);

    const order = await prisma.hostingOrder.findUnique({
      where: { id: orderId },
      include: { package: true, server: true, user: true },
    });

    if (!order) throw new Error(`Order ${orderId} not found`);
    if (!order.cpanelUsername || !order.cpanelPassword) {
      throw new Error(`Order ${orderId} missing cPanel credentials`);
    }

    try {
      const whm = getWHMClient(order.server);

      await whm.createAccount({
        username: order.cpanelUsername,
        password: decrypt(order.cpanelPassword),
        domain: order.domain,
        plan: order.package.name,
        email: order.user.email ?? undefined,
      });

      await prisma.hostingOrder.update({
        where: { id: orderId },
        data: { status: "ACTIVE", startDate: new Date() },
      });

      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: "SUCCESS",
          title: "Hosting đã sẵn sàng!",
          content: `Tài khoản hosting cho ${order.domain} đã được khởi tạo thành công.`,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: order.userId,
          action: "hosting.provision",
          resource: "hosting_order",
          resourceId: orderId,
          metadata: { status: "success", username: order.cpanelUsername },
        },
      });
    } catch (err: any) {
      // Leave the order in PENDING so the job can be retried; record the failure.
      await prisma.activityLog.create({
        data: {
          userId: order.userId,
          action: "hosting.provision",
          resource: "hosting_order",
          resourceId: orderId,
          metadata: { status: "failed", message: err.message },
        },
      });
      throw err;
    }
  },
  { connection, concurrency: 3 }
);

hostingWorker.on("failed", (job, err) => {
  console.error(`[Hosting Worker] Job ${job?.id} failed:`, err.message);
});
