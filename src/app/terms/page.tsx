"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import PublicShell, { SHELL_COLORS as C, type PublicContact } from "@/components/PublicShell";

export default function TermsPage() {
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
    { h: t("1. Chấp nhận điều khoản"), p: t("Bằng việc đăng ký và sử dụng dịch vụ, bạn đồng ý tuân thủ các điều khoản này. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.") },
    { h: t("2. Tài khoản và bảo mật"), p: t("Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động phát sinh từ tài khoản của mình. Hãy bật xác thực hai lớp (2FA) để tăng cường bảo mật.") },
    { h: t("3. Sử dụng dịch vụ hợp pháp"), p: t("Bạn cam kết không sử dụng dịch vụ cho các hoạt động vi phạm pháp luật, phát tán mã độc, spam, tấn công mạng hoặc xâm phạm quyền của bên thứ ba.") },
    { h: t("4. Thanh toán và gia hạn"), p: t("Các dịch vụ được tính phí theo chu kỳ đã chọn. Dịch vụ có thể tự động gia hạn nếu số dư ví đủ thanh toán. Bạn có trách nhiệm duy trì số dư để dịch vụ không bị gián đoạn.") },
    { h: t("5. Hoàn tiền"), p: t("Yêu cầu hoàn tiền được xem xét cho các dịch vụ đủ điều kiện trong thời gian quy định. Một số khoản phí như tên miền và chứng chỉ SSL có thể không được hoàn lại.") },
    { h: t("6. Cam kết dịch vụ (SLA)"), p: t("Chúng tôi nỗ lực duy trì độ sẵn sàng cao của hệ thống. Trong trường hợp gián đoạn do lỗi từ phía chúng tôi, bạn có thể được bù trừ theo chính sách SLA hiện hành.") },
    { h: t("7. Giới hạn trách nhiệm"), p: t("Chúng tôi không chịu trách nhiệm cho các thiệt hại gián tiếp phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ, trong phạm vi pháp luật cho phép.") },
    { h: t("8. Thay đổi điều khoản"), p: t("Chúng tôi có thể cập nhật các điều khoản này theo thời gian. Việc tiếp tục sử dụng dịch vụ sau khi cập nhật đồng nghĩa với việc bạn chấp nhận các thay đổi đó.") },
  ];

  return (
    <PublicShell appName={appName} contact={contact}>
      <LegalDoc
        kicker={t("Pháp lý")}
        title={t("Điều khoản sử dụng")}
        updated={t("Cập nhật lần cuối: tháng 6, 2026")}
        sections={sections}
      />
    </PublicShell>
  );
}

export function LegalDoc({
  kicker,
  title,
  updated,
  sections,
}: {
  kicker: string;
  title: string;
  updated: string;
  sections: { h: string; p: string }[];
}) {
  return (
    <section style={{ padding: "clamp(56px,8vw,96px) clamp(16px,4vw,48px)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <span style={{ color: C.blue, fontWeight: 700, fontSize: 13.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{kicker}</span>
        <h1 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.02em", marginTop: 10 }}>{title}</h1>
        <p style={{ color: C.faint, fontSize: 13.5, marginTop: 10 }}>{updated}</p>

        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 28 }}>
          {sections.map((s) => (
            <div key={s.h}>
              <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 10 }}>{s.h}</h2>
              <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.8 }}>{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
