"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import PublicShell, { SHELL_COLORS as C, type PublicContact } from "@/components/PublicShell";
import { FaqList } from "@/components/Landing";

export default function FaqPage() {
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

  const items = [
    { q: t("Tôi thanh toán bằng cách nào?"), a: t("Bạn có thể nạp ví qua VietQR/SePay với ghi nhận tức thì, hoặc dùng thẻ Visa/Mastercard, Stripe và PayPal cho thanh toán quốc tế.") },
    { q: t("Có hoàn tiền không?"), a: t("Chúng tôi áp dụng chính sách hoàn tiền cho các dịch vụ đủ điều kiện trong thời gian quy định. Vui lòng xem chi tiết tại trang Điều khoản sử dụng.") },
    { q: t("Uptime được cam kết ra sao?"), a: t("Chúng tôi cam kết uptime cao với hạ tầng dự phòng tại nhiều data center và giám sát 24/7.") },
    { q: t("Tôi nhận được hỗ trợ như thế nào?"), a: t("Đội ngũ kỹ thuật hỗ trợ qua hệ thống ticket và live-chat 24/7, phản hồi nhanh cho mọi vấn đề kỹ thuật.") },
    { q: t("Có dùng thử không?"), a: t("Bạn có thể đăng ký tài khoản miễn phí, khám phá bảng điều khiển và chỉ trả tiền khi kích hoạt dịch vụ.") },
    { q: t("Dữ liệu của tôi có an toàn không?"), a: t("Mọi dữ liệu nhạy cảm được mã hoá AES-256, tài khoản được bảo vệ bằng 2FA và chống gian lận nhiều lớp.") },
    { q: t("Tôi có thể nâng cấp gói dịch vụ không?"), a: t("Có. Bạn có thể nâng cấp VPS, hosting hoặc các dịch vụ khác bất cứ lúc nào ngay trong bảng điều khiển, chênh lệch được tính theo tỷ lệ.") },
    { q: t("Tôi có thể chuyển tên miền về đây không?"), a: t("Có. Hệ thống hỗ trợ chuyển tên miền từ nhà đăng ký khác về quản lý tập trung cùng các dịch vụ còn lại.") },
    { q: t("Chứng chỉ SSL được cấp như thế nào?"), a: t("Bạn có thể đặt mua SSL DV/OV/EV hoặc dùng cấp tự động Let's Encrypt; chứng chỉ được phát hành và gia hạn tự động.") },
    { q: t("Tôi có thể mời thành viên vào tài khoản không?"), a: t("Có. Bạn có thể mời thành viên team và phân quyền chi tiết theo từng vai trò để cùng quản lý dịch vụ.") },
  ];

  return (
    <PublicShell appName={appName} contact={contact}>
      <section style={{ padding: "clamp(56px,8vw,96px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ color: C.blue, fontWeight: 700, fontSize: 13.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("Trợ giúp")}</span>
            <h1 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.02em", marginTop: 10 }}>{t("Câu hỏi thường gặp")}</h1>
            <p style={{ color: C.muted, fontSize: "clamp(15px,2vw,17px)", marginTop: 12, lineHeight: 1.7 }}>
              {t("Tổng hợp những câu hỏi phổ biến nhất về dịch vụ, thanh toán và hỗ trợ.")}
            </p>
          </div>
          <FaqList items={items} t={t} />
        </div>
      </section>
    </PublicShell>
  );
}
