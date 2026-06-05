import { prisma } from "@/lib/prisma";

export const DEFAULT_TEMPLATES = [
  { key: "renewal_reminder", name: "Nhắc gia hạn dịch vụ", subject: "[ShopVPS] {{service}} sắp hết hạn", body: "<p>Xin chào {{name}},</p><p>Dịch vụ <b>{{service}}</b> của bạn sẽ hết hạn vào <b>{{expiry}}</b>.</p><p>Phí gia hạn: <b>{{price}}</b>.</p><p>{{note}}</p><p><a href=\"{{walletUrl}}\">Nạp tiền / kiểm tra ví</a></p>" },
  { key: "deposit_success", name: "Nạp tiền thành công", subject: "[ShopVPS] Nạp tiền thành công", body: "<p>Xin chào {{name}},</p><p>Tài khoản của bạn đã được cộng <b>{{amount}}</b>.</p><p>Số dư hiện tại: <b>{{balance}}</b>.</p>" },
  { key: "ticket_reply", name: "Phản hồi ticket", subject: "[ShopVPS] Phản hồi cho ticket: {{subject}}", body: "<p>Xin chào {{name}},</p><p>Ticket \"{{subject}}\" của bạn vừa có phản hồi mới từ đội hỗ trợ.</p><p><a href=\"{{ticketUrl}}\">Xem ticket</a></p>" },
  { key: "welcome", name: "Chào mừng", subject: "Chào mừng đến với ShopVPS", body: "<p>Xin chào {{name}},</p><p>Cảm ơn bạn đã đăng ký. Chúc bạn trải nghiệm tuyệt vời!</p>" },
  // English variants — looked up automatically for recipients whose locale is "en".
  { key: "renewal_reminder_en", name: "Renewal reminder (EN)", subject: "[ShopVPS] {{service}} is expiring soon", body: "<p>Hello {{name}},</p><p>Your service <b>{{service}}</b> will expire on <b>{{expiry}}</b>.</p><p>Renewal fee: <b>{{price}}</b>.</p><p>{{note}}</p><p><a href=\"{{walletUrl}}\">Top up / check wallet</a></p>" },
  { key: "deposit_success_en", name: "Deposit success (EN)", subject: "[ShopVPS] Deposit successful", body: "<p>Hello {{name}},</p><p>Your account has been credited with <b>{{amount}}</b>.</p><p>Current balance: <b>{{balance}}</b>.</p>" },
  { key: "ticket_reply_en", name: "Ticket reply (EN)", subject: "[ShopVPS] Reply to your ticket: {{subject}}", body: "<p>Hello {{name}},</p><p>Your ticket \"{{subject}}\" has a new reply from our support team.</p><p><a href=\"{{ticketUrl}}\">View ticket</a></p>" },
  { key: "welcome_en", name: "Welcome (EN)", subject: "Welcome to ShopVPS", body: "<p>Hello {{name}},</p><p>Thank you for signing up. Enjoy your experience!</p>" },
];

function fill(s: string, vars: Record<string, any>): string {
  return s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
}

/**
 * Render an admin-configurable email template. Returns null when the template
 * is missing/inactive so callers can fall back to their built-in copy.
 *
 * When `locale` is "en", the `<key>_en` template is tried first and the base
 * (Vietnamese) template is used as a fallback.
 */
export async function renderTemplate(
  key: string,
  vars: Record<string, any>,
  locale: string = "vi",
): Promise<{ subject: string; html: string } | null> {
  try {
    const keys = locale === "en" ? [`${key}_en`, key] : [key];
    for (const k of keys) {
      const t = await prisma.emailTemplate.findUnique({ where: { key: k } });
      if (t && t.isActive) return { subject: fill(t.subject, vars), html: fill(t.body, vars) };
    }
    return null;
  } catch {
    return null;
  }
}
