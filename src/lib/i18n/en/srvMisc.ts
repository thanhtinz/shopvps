// EN translations (Vietnamese literal -> English).
const m: Record<string, string> = {
  // Invoice PDF (src/app/api/invoices/pdf/route.ts)
  "Hoá đơn": "Invoice",
  "HOÁ ĐƠN": "INVOICE",
  "Đã thanh toán": "Paid",
  "Thông tin khách hàng": "Customer information",
  "MST:": "Tax ID:",
  "Chi tiết hoá đơn": "Invoice details",
  "Ngày tạo:": "Created date:",
  "Ngày thanh toán:": "Payment date:",
  "Mô tả": "Description",
  "Số lượng": "Quantity",
  "Đơn giá": "Unit price",
  "Thành tiền": "Amount",
  "Giảm giá": "Discount",
  "Trong đó thuế VAT (đã gồm):": "Of which VAT (included):",
  "Tổng cộng:": "Total:",
  "Cảm ơn bạn đã sử dụng dịch vụ của": "Thank you for using the service of",
  "Nếu có thắc mắc, vui lòng liên hệ qua hệ thống ticket hỗ trợ.": "If you have any questions, please contact us via the support ticket system.",
  // Root layout metadata + dashboard greeting fallback
  "Quản lý VPS & Hosting chuyên nghiệp": "Professional VPS & Hosting management",
  "bạn": "you",
  // Payment gateway deposit instructions (manual.ts / sepay.ts)
  "Chuyển khoản ngân hàng (thủ công)": "Bank transfer (manual)",
  "Chuyển khoản tự động (SePay)": "Automatic bank transfer (SePay)",
  "Ngân hàng": "Bank",
  "Số tài khoản": "Account number",
  "Chủ tài khoản": "Account holder",
  "Số tiền": "Amount",
  "Nội dung CK": "Transfer note",
  "Chuyển khoản theo thông tin dưới đây": "Transfer using the details below",
  "Ghi đúng nội dung chuyển khoản. Giao dịch sẽ được duyệt sau khi admin xác nhận.": "Enter the transfer note exactly. The transaction will be approved after an admin confirms it.",
  "Quét mã QR hoặc chuyển khoản": "Scan the QR code or transfer",
  "Tài khoản sẽ tự động được cộng tiền sau khi nhận chuyển khoản (vài giây).": "Your account will be credited automatically once the transfer is received (a few seconds).",
  // Stripe / PayPal gateway errors + product name
  "Stripe chưa được cấu hình": "Stripe is not configured",
  "Không tạo được phiên Stripe": "Could not create the Stripe session",
  "Nạp tiền tài khoản": "Account top-up",
  "PayPal chưa được cấu hình": "PayPal is not configured",
  "Không tạo được đơn PayPal": "Could not create the PayPal order",
};
export default m;
