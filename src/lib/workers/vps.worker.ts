import { Worker, Job } from "bullmq";

import { prisma } from "@/lib/prisma";
import { getVpsProvider } from "@/lib/vps-providers";
import { decrypt, encrypt } from "@/lib/encrypt";
import crypto from "crypto";
import { getUserT } from "@/lib/i18n/server";

const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };

export const vpsWorker = new Worker(
  "vps-provision",
  async (job: Job) => {
    const { orderId } = job.data;
    console.log(`[VPS Worker] Provisioning order ${orderId}`);

    const order = await prisma.vpsOrder.findUnique({
      where: { id: orderId },
      include: { package: true, provider: true, user: true },
    });

    if (!order || !order.provider.apiKey) {
      throw new Error(`Order ${orderId} not found or provider missing API key`);
    }

    await prisma.vpsOrder.update({ where: { id: orderId }, data: { status: "PENDING" } });

    try {
      const provider = getVpsProvider(order.provider.slug, decrypt(order.provider.apiKey));
      const password = crypto.randomBytes(12).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 16) + "A1!";

      const serverInfo = await provider.createServer({
        hostname: order.hostname,
        planId: order.package.slug,
        regionId: order.region || process.env.DEFAULT_VPS_REGION || "sgp",
        osId: order.os,
        password,
      });

      await prisma.vpsOrder.update({
        where: { id: orderId },
        data: {
          status: "ACTIVE",
          providerVpsId: serverInfo.id,
          ipAddress: serverInfo.ipAddress,
          rootPassword: encrypt(password),
          startDate: new Date(),
        },
      });

      // Notify user
      const { t } = await getUserT(order.userId);
      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: "VPS",
          title: t("VPS đã sẵn sàng!"),
          content: `VPS ${order.hostname} (${serverInfo.ipAddress}) ${t("đã được khởi tạo thành công.")}`,
        },
      });

      await prisma.vpsLog.create({
        data: { vpsOrderId: orderId, action: "provision", status: "success", message: `IP: ${serverInfo.ipAddress}`, performedBy: "system" },
      });
    } catch (err: any) {
      await prisma.vpsOrder.update({ where: { id: orderId }, data: { status: "SUSPENDED" } });
      await prisma.vpsLog.create({
        data: { vpsOrderId: orderId, action: "provision", status: "failed", message: err.message, performedBy: "system" },
      });
      throw err;
    }
  },
  { connection, concurrency: 3 }
);

vpsWorker.on("failed", (job, err) => {
  console.error(`[VPS Worker] Job ${job?.id} failed:`, err.message);
});
