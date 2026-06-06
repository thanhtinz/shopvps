// EN translations for the admin Settings guidance, doc links, webhook URLs.
const m: Record<string, string> = {
  // section help
  "Tên và URL hiển thị toàn site, dùng trong email, hoá đơn và các liên kết.": "Name and URL shown across the site, used in emails, invoices and links.",
  "Chống bot khi đăng ký và chấm điểm gian lận. Để trống = tắt (không chặn ai).": "Bot protection on signup + fraud scoring. Leave blank to disable (blocks no one).",
  "Cấp SSL miễn phí tự động qua DNS-01 (cần Registrar quản lý DNS của domain). Hãy test staging trước khi bật production để tránh rate-limit. Cần chạy npm install acme-client ở môi trường thật.": "Free automatic SSL via DNS-01 (the registrar must manage the domain DNS). Test against staging before enabling production to avoid rate limits. Run npm install acme-client in production.",
  "Dán các URL dưới đây vào trang quản trị của cổng thanh toán tương ứng để nhận thông báo giao dịch. Cấu hình khoá API từng cổng tại trang Cổng thanh toán.": "Paste the URLs below into each payment gateway dashboard to receive transaction notifications. Configure each gateway's API keys on the Payment Gateways page.",
  "Hiện widget chat toàn site + banner đồng ý cookie. provider: tawk/crisp dùng script, messenger/zalo hiện nút nổi.": "Site-wide chat widget + cookie consent banner. provider: tawk/crisp inject a script, messenger/zalo show a floating button.",
  "SMTP để gửi email giao dịch (xác thực, hoá đơn, nhắc hạn). Mật khẩu SMTP đặt qua biến môi trường SMTP_PASS.": "SMTP for transactional email (verification, invoices, reminders). Set the SMTP password via the SMTP_PASS env var.",
  "Tỷ lệ hoa hồng giới thiệu và cấu hình tự động chi trả.": "Referral commission rate and automatic payout configuration.",
  "Thuế suất áp vào hoá đơn. Giá niêm yết đã bao gồm VAT. Quy tắc theo quốc gia đặt tại trang Quy tắc thuế.": "Tax rate applied to invoices. Listed prices include VAT. Per-country rules live on the Tax Rules page.",
  "Tự cấp game server qua panel. Tạo Application key (ptla_) trong Admin panel, Client key (ptlc_) trong tài khoản sở hữu server. Cho phép Origin = URL website để console websocket hoạt động.": "Auto-provision game servers via the panel. Create an Application key (ptla_) in the admin panel and a Client key (ptlc_) on the owning account. Allow Origin = your website URL so the console websocket works.",
  "Đăng ký/gia hạn/transfer + DNS qua registrar. Lấy API key từ trang quản trị registrar. Bật sandbox để thử nghiệm.": "Register/renew/transfer + DNS via the registrar. Get the API key from the registrar dashboard. Enable sandbox for testing.",
  "Bật/tắt từng module và nhóm sản phẩm hiển thị trong cửa hàng.": "Toggle each module and product group shown in the store.",
  "Vòng đời gia hạn: tạo hoá đơn trước hạn, tự trừ ví, tạm dừng rồi huỷ khi quá hạn.": "Renewal lifecycle: generate invoices before expiry, auto-charge the wallet, suspend then terminate when overdue.",
  "Chế độ bảo trì chặn truy cập tạm thời; Demo ẩn thao tác nhạy cảm.": "Maintenance mode blocks access temporarily; Demo hides sensitive actions.",
  // section title + test
  "Cổng thanh toán — Webhook & Callback": "Payment gateways — Webhooks & Callbacks",
  "Test ACME (staging)": "Test ACME (staging)",
  "Đang test...": "Testing...",
  // doc labels
  "Tạo khoá reCAPTCHA v3": "Create reCAPTCHA v3 keys",
  "MaxMind minFraud": "MaxMind minFraud",
  "Directory staging (dán vào ô bên dưới để test)": "Staging directory (paste below to test)",
  "Cấu hình cổng & khoá API": "Configure gateways & API keys",
  "Stripe Webhooks": "Stripe Webhooks",
  "SePay Webhooks": "SePay Webhooks",
  "NameSilo API Manager": "NameSilo API Manager",
  "Pterodactyl API docs": "Pterodactyl API docs",
  // link labels
  "SePay Webhook (chuyển khoản NH)": "SePay Webhook (bank transfer)",
  "Stripe Webhook": "Stripe Webhook",
  "PayPal Capture/Return": "PayPal Capture/Return",
  "Webhook (URL nhận biến động số dư)": "Webhook (balance-change URL)",
  "Webhook endpoint": "Webhook endpoint",
  "Return/Capture URL": "Return/Capture URL",
  // field label tweak
  "URL website (vd https://shop.example.com)": "Website URL (e.g. https://shop.example.com)",
  // ACME test endpoint
  "Chưa cấu hình email ACME": "ACME email not configured",
  "Chưa cài acme-client (chạy npm install ở môi trường thật)": "acme-client not installed (run npm install in production)",
  "Kết nối ACME staging thành công. Tài khoản đã tạo.": "ACME staging connection OK. Account created.",
  "Lỗi ACME": "ACME error",
};
export default m;
