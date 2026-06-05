import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { queueEmail } from "./index";

const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };

export const renewWorker = new Worker("auto-renew", async (job: Job) => {
  const { orderId, type } = job.data;
  if (type !== "vps") return;

  const order = await prisma.vpsOrder.findUnique({ where: { id: orderId }, include: { user: true } });
  if (!order || !order.autoRenew) return;

  const user = await prisma.user.findUnique({ where: { id: order.userId } });
  if (!user) return;

  if (Number(user.balance) < Number(order.price)) {
    await prisma.notification.create({ data: { userId: order.userId, type: "VPS", title: "VPS sắp bị tạm dừng", content: `VPS ${order.hostname} không đủ số dư để gia hạn.` } });
    await queueEmail(user.email!, "VPS sắp hết hạn", `<p>VPS <strong>${order.hostname}</strong> sẽ bị tạm dừng do không đủ số dư.</p>`);
    return;
  }

  const newBalance = Number(user.balance) - Number(order.price);
  const newExpiry = new Date(order.expiresAt!);
  newExpiry.setMonth(newExpiry.getMonth() + 1);

  await prisma.$transaction(async (tx: any) => {
    await tx.user.update({ where: { id: order.userId }, data: { balance: newBalance } });
    await tx.vpsOrder.update({ where: { id: orderId }, data: { expiresAt: newExpiry } });
    await tx.transaction.create({ data: { userId: order.userId, type: "PURCHASE", amount: order.price, balanceBefore: Number(user.balance), balanceAfter: newBalance, description: `Gia hạn VPS ${order.hostname}`, status: "COMPLETED" } });
  });

  await prisma.notification.create({ data: { userId: order.userId, type: "VPS", title: "VPS đã gia hạn thành công", content: `VPS ${order.hostname} đã gia hạn đến ${newExpiry.toLocaleDateString("vi-VN")}` } });
}, { connection: connection as any });
