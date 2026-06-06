// EN translations for staff RBAC (permission module labels + staff page).
const m: Record<string, string> = {
  // module labels (src/lib/permissions.ts)
  "Người dùng": "Users",
  "Đơn hàng & yêu cầu": "Orders & requests",
  "Tài chính (hoá đơn, giao dịch, payout, thuế)": "Finance (invoices, transactions, payouts, tax)",
  "Báo cáo": "Reports",
  "Sản phẩm & bậc giá": "Products & price tiers",
  "VPS (provider, gói)": "VPS (providers, packages)",
  "Hosting (server, gói)": "Hosting (servers, packages)",
  "Tên miền & TLD": "Domains & TLDs",
  "Game hosting": "Game hosting",
  "Hỗ trợ (ticket, phòng ban)": "Support (tickets, departments)",
  "Bảo mật (gian lận, blocklist)": "Security (fraud, blocklist)",
  "Marketing (email, coupon, KB, quà tặng)": "Marketing (email, coupons, KB, gifts)",
  "Cài đặt hệ thống": "System settings",
  // staff page + sidebar
  "Nhân viên & phân quyền": "Staff & permissions",
  "Cấp quyền truy cập từng module cho admin. Super Admin có toàn quyền.": "Grant per-module access to admins. Super Admin has full access.",
  "module được phép": "modules allowed",
  "Chưa cấp quyền nào": "No permissions granted",
  "Phân quyền": "Permissions",
  "Gỡ admin": "Remove admin",
  "Gỡ quyền admin của người này?": "Remove this person's admin access?",
  "Chọn các module admin này được phép truy cập": "Select the modules this admin may access",
  "Lưu quyền": "Save permissions",
  "Lưu ý: admin cần đăng nhập lại để quyền mới có hiệu lực.": "Note: the admin must sign in again for new permissions to take effect.",
  "Không thể chỉnh sửa Super Admin": "Cannot edit a Super Admin",
};
export default m;
