"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import PublicShell, { type PublicContact } from "@/components/PublicShell";
import { LegalDoc } from "@/app/terms/page";

export default function PrivacyPage() {
  const { t } = useLocale();
  const [appName, setAppName] = useState("ShopVPS");
  const [contact, setContact] = useState<PublicContact | undefined>();

  useEffect(() => {
    fetch("/api/landing")
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.appName) setAppName(j.data.appName);
        if (j?.data?.contact) setContact(j.data.contact);
      })
      .catch(() => {});
  }, []);

  const sections = [
    { h: t("1. Thông tin chúng tôi thu thập"), p: t("Chúng tôi thu thập thông tin bạn cung cấp khi đăng ký (tên, email, số điện thoại) và dữ liệu phát sinh khi sử dụng dịch vụ như nhật ký truy cập, lịch sử giao dịch và cấu hình dịch vụ.") },
    { h: t("2. Cách chúng tôi sử dụng thông tin"), p: t("Thông tin được dùng để cung cấp và vận hành dịch vụ, xử lý thanh toán, hỗ trợ kỹ thuật, phòng chống gian lận và cải thiện trải nghiệm của bạn.") },
    { h: t("3. Bảo mật dữ liệu"), p: t("Mọi dữ liệu nhạy cảm được mã hoá AES-256 khi lưu trữ và truyền qua kết nối an toàn. Chúng tôi áp dụng nhiều lớp kiểm soát truy cập để bảo vệ thông tin của bạn.") },
    { h: t("4. Chia sẻ với bên thứ ba"), p: t("Chúng tôi không bán dữ liệu cá nhân của bạn. Thông tin chỉ được chia sẻ với các đối tác cần thiết (cổng thanh toán, nhà đăng ký tên miền, nhà cung cấp hạ tầng) để vận hành dịch vụ.") },
    { h: t("5. Cookie"), p: t("Chúng tôi sử dụng cookie để duy trì phiên đăng nhập, ghi nhớ tuỳ chọn ngôn ngữ và phân tích việc sử dụng. Bạn có thể quản lý cookie trong trình duyệt của mình.") },
    { h: t("6. Quyền của bạn"), p: t("Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xoá dữ liệu cá nhân của mình. Vui lòng liên hệ chúng tôi để thực hiện các quyền này.") },
    { h: t("7. Lưu trữ dữ liệu"), p: t("Chúng tôi lưu giữ dữ liệu trong thời gian cần thiết để cung cấp dịch vụ và tuân thủ nghĩa vụ pháp lý. Dữ liệu sẽ được xoá an toàn khi không còn cần thiết.") },
    { h: t("8. Liên hệ về quyền riêng tư"), p: t("Nếu bạn có câu hỏi về chính sách bảo mật này, vui lòng liên hệ với chúng tôi qua trang Liên hệ.") },
  ];

  return (
    <PublicShell appName={appName} contact={contact}>
      <LegalDoc
        kicker={t("Pháp lý")}
        title={t("Chính sách bảo mật")}
        updated={t("Cập nhật lần cuối: tháng 6, 2026")}
        sections={sections}
      />
    </PublicShell>
  );
}
