// EN translations (Vietnamese literal -> English).
const m: Record<string, string> = {
  // payments/credit.ts
  "Thưởng nạp tiền": "Top-up bonus",
  "Nạp tiền thành công": "Top-up successful",
  "Tài khoản đã được cộng": "Your account has been credited",

  // workers/autorenew.worker.ts
  "VPS đã gia hạn": "VPS renewed",
  "đã được gia hạn": "has been renewed for",
  "tháng.": "month(s).",
  "VPS bị tạm dừng": "VPS suspended",
  "đã bị tạm dừng do không đủ số dư để gia hạn.": "has been suspended due to insufficient balance for renewal.",
  "Hosting đã gia hạn": "Hosting renewed",
  "Hosting bị tạm dừng": "Hosting suspended",

  // workers/vps.worker.ts & hosting.worker.ts
  "VPS đã sẵn sàng!": "VPS is ready!",
  "đã được khởi tạo thành công.": "has been provisioned successfully.",
  "Hosting đã sẵn sàng!": "Hosting is ready!",
  "Tài khoản hosting cho": "The hosting account for",

  // workers/reminder.worker.ts (notification)
  "Dịch vụ sắp hết hạn": "Service expiring soon",
  "sẽ hết hạn vào": "will expire on",
  "phí gia hạn": "renewal fee",
  "Dịch vụ sẽ tự động gia hạn bằng số dư ví.": "The service will auto-renew using your wallet balance.",
  "Số dư ví của bạn KHÔNG đủ để tự gia hạn — vui lòng nạp thêm để tránh bị tạm ngưng.": "Your wallet balance is NOT enough to auto-renew — please top up to avoid suspension.",
  "Tự động gia hạn đang TẮT — vui lòng gia hạn thủ công trước khi hết hạn.": "Auto-renew is OFF — please renew manually before expiry.",

  // api/vps/order & api/hosting/order
  "Mua VPS": "Purchase VPS",
  "Mua Hosting": "Purchase Hosting",

  // api/wallet/*
  "Rút hoa hồng về ví chính": "Withdraw commission to main wallet",
  "Nạp tiền qua": "Top-up via",
  "Đổi mã quà tặng": "Redeem gift code",

  // api/admin/domains/[id] & api/domains/*
  "Tên miền đã kích hoạt": "Domain activated",
  "Tên miền": "Domain",
  "đã được kích hoạt.": "has been activated.",
  "Gia hạn tên miền": "Renew domain",
  "năm": "year(s)",
  "Đăng ký": "Register",
  "tên miền": "domain",

  // api/admin/users
  "Admin điều chỉnh số dư bởi": "Balance adjusted by admin",

  // api/admin/tickets/[id]/messages
  "Phản hồi hỗ trợ mới": "New support reply",
  "có phản hồi từ admin.": "has a reply from admin.",

  // api/webhook/sepay
  "Nạp tiền qua ngân hàng": "Bank transfer top-up",
  "Tài khoản được cộng": "Account credited with",
  "bao gồm bonus": "including bonus",

  // api/admin/commissions
  "Hoa hồng đã được duyệt": "Commission approved",
  "Bạn nhận được": "You received",
  "hoa hồng giới thiệu.": "in referral commission.",

  // api/admin/service-requests
  "dịch vụ": "service",
  "Yêu cầu dịch vụ đã được xử lý": "Service request processed",
  "Yêu cầu": "Request",
  "của bạn đã được duyệt.": "has been approved.",
};
export default m;
