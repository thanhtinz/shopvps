import { Worker, Queue, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { queueEmail } from "./index";
import { formatCurrency, formatDate } from "@/lib/utils";

const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };

const REMIND_WITHIN_DAYS = 3; // notify when a service expires within this window
const COOLDOWN_DAYS = 14;     // don't re-notify the same service within this period

export const reminderQueue = new Queue("reminders", { connection } as any);

export const reminderWorker = new Worker(
  "reminders",
  async (_job: Job) => { await scanAndRemind(); },
  { connection: connection as any }
);

reminderWorker.on("failed", (job, err) => {
  console.error(`[Reminder Worker] Job ${job?.id} failed:`, err.message);
});

// Schedule a recurring scan (every 6h) plus one shortly after startup.
reminderQueue.add("scan", {}, { repeat: { every: 6 * 60 * 60 * 1000 } }).catch(() => {});
reminderQueue.add("scan-initial", {}, { delay: 30_000 }).catch(() => {});

async function scanAndRemind() {
  const now = new Date();
  const soon = new Date(now.getTime() + REMIND_WITHIN_DAYS * 86400000);
  const cooldown = new Date(now.getTime() - COOLDOWN_DAYS * 86400000);
  const due = { OR: [{ renewReminderAt: null }, { renewReminderAt: { lt: cooldown } }] };

  const vps = await prisma.vpsOrder.findMany({
    where: { status: "ACTIVE", expiresAt: { gte: now, lte: soon }, ...due },
    include: { user: { select: { email: true, name: true, balance: true } }, package: { select: { name: true } } },
  });
  for (const o of vps) await remind("vps", o);

  const hosting = await prisma.hostingOrder.findMany({
    where: { status: "ACTIVE", expiresAt: { gte: now, lte: soon }, ...due },
    include: { user: { select: { email: true, name: true, balance: true } }, package: { select: { name: true } } },
  });
  for (const o of hosting) await remind("hosting", o);

  if (vps.length || hosting.length) console.log(`[Reminder Worker] Sent ${vps.length + hosting.length} renewal reminders`);
}

async function remind(kind: "vps" | "hosting", o: any) {
  const name = kind === "vps" ? (o.hostname || o.package?.name || "VPS") : (o.domain || o.package?.name || "Hosting");
  const price = Number(o.price || 0);
  const enough = Number(o.user?.balance || 0) >= price;
  const expiry = formatDate(o.expiresAt);
  const autoNote = o.autoRenew
    ? (enough
        ? "Dịch vụ sẽ tự động gia hạn bằng số dư ví."
        : "Số dư ví của bạn KHÔNG đủ để tự gia hạn — vui lòng nạp thêm để tránh bị tạm ngưng.")
    : "Tự động gia hạn đang TẮT — vui lòng gia hạn thủ công trước khi hết hạn.";

  await prisma.notification.create({
    data: {
      userId: o.userId,
      type: enough && o.autoRenew ? "INFO" : "WARNING",
      title: "Dịch vụ sắp hết hạn",
      content: `${kind.toUpperCase()} ${name} sẽ hết hạn vào ${expiry} (phí gia hạn ${formatCurrency(price)}). ${autoNote}`,
    },
  });

  try {
    await queueEmail(
      o.user.email,
      `[ShopVPS] ${kind.toUpperCase()} ${name} sắp hết hạn`,
      `<p>Xin chào ${o.user.name || ""},</p>
       <p>Dịch vụ <b>${kind.toUpperCase()} ${name}</b> của bạn sẽ hết hạn vào <b>${expiry}</b>.</p>
       <p>Phí gia hạn: <b>${formatCurrency(price)}</b>.</p>
       <p>${autoNote}</p>
       <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/wallet">Nạp tiền / kiểm tra ví</a></p>`
    );
  } catch {}

  const data = { renewReminderAt: new Date() };
  if (kind === "vps") await prisma.vpsOrder.update({ where: { id: o.id }, data });
  else await prisma.hostingOrder.update({ where: { id: o.id }, data });
}
