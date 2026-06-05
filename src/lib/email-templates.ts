import { prisma } from "@/lib/prisma";

export const DEFAULT_TEMPLATES = [
  { key: "renewal_reminder", name: "Nhắc gia hạn dịch vụ", subject: "[ShopVPS] {{service}} sắp hết hạn", body: "<p>Xin chào {{name}},</p><p>Dịch vụ <b>{{service}}</b> của bạn sẽ hết hạn vào <b>{{expiry}}</b>.</p><p>Phí gia hạn: <b>{{price}}</b>.</p><p>{{note}}</p><p><a href=\"{{walletUrl}}\">Nạp tiền / kiểm tra ví</a></p>" },
  { key: "deposit_success", name: "Nạp tiền thành công", subject: "[ShopVPS] Nạp tiền thành công", body: "<p>Xin chào {{name}},</p><p>Tài khoản của bạn đã được cộng <b>{{amount}}</b>.</p><p>Số dư hiện tại: <b>{{balance}}</b>.</p>" },
  { key: "ticket_reply", name: "Phản hồi ticket", subject: "[ShopVPS] Phản hồi cho ticket: {{subject}}", body: "<p>Xin chào {{name}},</p><p>Ticket \"{{subject}}\" của bạn vừa có phản hồi mới từ đội hỗ trợ.</p><p><a href=\"{{ticketUrl}}\">Xem ticket</a></p>" },
  { key: "welcome", name: "Chào mừng", subject: "Chào mừng đến với ShopVPS", body: "<p>Xin chào {{name}},</p><p>Cảm ơn bạn đã đăng ký. Chúc bạn trải nghiệm tuyệt vời!</p>" },
];

function fill(s: string, vars: Record<string, any>): string {
  return s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
}

/**
 * Render an admin-configurable email template. Returns null when the template
 * is missing/inactive so callers can fall back to their built-in copy.
 */
export async function renderTemplate(key: string, vars: Record<string, any>): Promise<{ subject: string; html: string } | null> {
  try {
    const t = await prisma.emailTemplate.findUnique({ where: { key } });
    if (!t || !t.isActive) return null;
    return { subject: fill(t.subject, vars), html: fill(t.body, vars) };
  } catch {
    return null;
  }
}
