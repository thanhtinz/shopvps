// EN translations (Vietnamese literal -> English) — final coverage fixups.
const m: Record<string, string> = {
  // settings/page.tsx — toasts & messages
  "Đã lưu thay đổi!": "Changes saved!",
  "Mật khẩu xác nhận không khớp": "Password confirmation does not match",
  "Đã đổi mật khẩu thành công!": "Password changed successfully!",
  "Đã bật xác thực 2 lớp!": "Two-factor authentication enabled!",
  "Đã tắt xác thực 2 lớp.": "Two-factor authentication disabled.",

  // settings/page.tsx — profile
  "Email đã xác thực": "Email verified",
  "Email chưa xác thực": "Email not verified",
  "Họ tên": "Full name",
  "Thông tin xuất hoá đơn": "Billing information",
  "Công ty": "Company",
  "Số điện thoại": "Phone number",
  "Địa chỉ": "Address",
  "Thành phố": "City",
  "Quốc gia": "Country",
  "Mã số thuế": "Tax ID",
  "Đang lưu...": "Saving...",
  "Lưu thay đổi": "Save changes",

  // settings/page.tsx — appearance
  "Tối": "Dark",
  "Sáng": "Light",
  "Tuỳ chọn": "Custom",
  "Cỡ chữ": "Font size",
  "Trái → Phải (LTR)": "Left → Right (LTR)",
  "Phải → Trái (RTL)": "Right → Left (RTL)",
  "Tuỳ chỉnh được lưu trên trình duyệt này và áp dụng tức thì.": "Customizations are saved in this browser and applied instantly.",

  // appearance.ts — FONT_PRESETS labels (rendered via t(f.label))
  "Mặc định (Jakarta)": "Default (Jakarta)",
  "Hệ thống": "System",
  "Inter": "Inter",
  "Serif": "Serif",

  // settings/page.tsx — security
  "Đổi mật khẩu": "Change password",
  "Mật khẩu hiện tại": "Current password",
  "Mật khẩu mới": "New password",
  "Xác nhận mật khẩu mới": "Confirm new password",
  "Đang đổi...": "Changing...",

  // settings/page.tsx — 2FA
  "Xác thực 2 lớp (2FA)": "Two-factor authentication (2FA)",
  "Đang bật — tài khoản được bảo vệ": "Enabled — your account is protected",
  "Chưa bật — tài khoản có thể bị xâm nhập": "Not enabled — your account may be compromised",
  "Bật 2FA để thêm lớp bảo vệ. Mỗi lần đăng nhập sẽ yêu cầu mã từ ứng dụng Google Authenticator.": "Enable 2FA to add a layer of protection. Each login will require a code from the Google Authenticator app.",
  "Bật xác thực 2 lớp": "Enable two-factor authentication",
  "Quét mã QR bằng Google Authenticator, sau đó nhập mã 6 số để xác nhận.": "Scan the QR code with Google Authenticator, then enter the 6-digit code to confirm.",
  "Nhập thủ công:": "Enter manually:",
  "Huỷ": "Cancel",
  "Xác nhận bật 2FA": "Confirm enabling 2FA",
  "Nhập mã từ ứng dụng xác thực để tắt 2FA.": "Enter the code from your authenticator app to disable 2FA.",
  "Tắt xác thực 2 lớp": "Disable two-factor authentication",

  // autorenew.worker.ts
  "Gia hạn VPS": "VPS renewal",
  "VPS đã gia hạn": "VPS renewed",
  "đã được gia hạn": "has been renewed for",
  "tháng.": "month(s).",
  "VPS bị tạm dừng": "VPS suspended",
  "đã bị tạm dừng do không đủ số dư để gia hạn.": "has been suspended due to insufficient balance for renewal.",
  "đã bị tạm dừng do không đủ số dư. Vui lòng nạp tiền và liên hệ hỗ trợ để kích hoạt lại.": "has been suspended due to insufficient balance. Please top up your account and contact support to reactivate.",
  "Gia hạn Hosting": "Hosting renewal",
  "Hosting đã gia hạn": "Hosting renewed",
  "Hosting bị tạm dừng": "Hosting suspended",
  "Không đủ số dư gia hạn": "Insufficient balance for renewal",

  // wallet/redeem/route.ts
  "Vui lòng nhập mã": "Please enter a code",
  "Đổi mã quà tặng": "Gift code redemption",
  "Đã cộng": "Added",
  "vào ví.": "to your wallet.",
  "Mã không hợp lệ, đã dùng hoặc hết hạn": "Code is invalid, already used, or expired",
  "Không thể đổi mã": "Unable to redeem code",

  // payments/stripe.ts
  "Thẻ quốc tế (Stripe)": "International card (Stripe)",
  "Stripe chưa được cấu hình": "Stripe is not configured",
  "Nạp tiền tài khoản": "Account top-up",
  "Không tạo được phiên Stripe": "Failed to create Stripe session",
};
export default m;
