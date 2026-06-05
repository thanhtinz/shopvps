import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  await transporter.sendMail({
    from: `ShopVPS <${process.env.SMTP_FROM}>`,
    ...options,
  });
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Xác thực email - ShopVPS",
    html: emailTemplate({
      title: "Xác thực địa chỉ email",
      body: `<p>Nhấn vào nút bên dưới để xác thực địa chỉ email của bạn:</p>`,
      ctaUrl: url,
      ctaText: "Xác thực Email",
    }),
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Đặt lại mật khẩu - ShopVPS",
    html: emailTemplate({
      title: "Đặt lại mật khẩu",
      body: `<p>Nhấn vào nút bên dưới để đặt lại mật khẩu. Link có hiệu lực trong 1 giờ.</p>`,
      ctaUrl: url,
      ctaText: "Đặt lại mật khẩu",
    }),
  });
}

export async function sendVpsCreatedEmail(email: string, vpsInfo: {
  label: string; ip: string; os: string; password: string;
}): Promise<void> {
  await sendEmail({
    to: email,
    subject: `VPS ${vpsInfo.label} đã sẵn sàng - ShopVPS`,
    html: emailTemplate({
      title: "VPS của bạn đã sẵn sàng!",
      body: `
        <p>VPS <strong>${vpsInfo.label}</strong> đã được tạo thành công.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #333;color:#aaa">IP Address</td><td style="padding:8px;border:1px solid #333">${vpsInfo.ip}</td></tr>
          <tr><td style="padding:8px;border:1px solid #333;color:#aaa">OS</td><td style="padding:8px;border:1px solid #333">${vpsInfo.os}</td></tr>
          <tr><td style="padding:8px;border:1px solid #333;color:#aaa">Root Password</td><td style="padding:8px;border:1px solid #333;font-family:monospace">${vpsInfo.password}</td></tr>
        </table>
      `,
      ctaUrl: `${process.env.NEXTAUTH_URL}/vps`,
      ctaText: "Quản lý VPS",
    }),
  });
}

function emailTemplate({ title, body, ctaUrl, ctaText }: {
  title: string; body: string; ctaUrl?: string; ctaText?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',sans-serif;color:#e2e8f0">
  <div style="max-width:560px;margin:40px auto;background:#111827;border:1px solid #1f2937;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">ShopVPS</h1>
    </div>
    <div style="padding:32px">
      <h2 style="color:#f1f5f9;margin-top:0">${title}</h2>
      <div style="color:#94a3b8;line-height:1.6">${body}</div>
      ${ctaUrl ? `
      <div style="text-align:center;margin-top:32px">
        <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600">${ctaText}</a>
      </div>` : ""}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #1f2937;text-align:center;color:#475569;font-size:12px">
      © ${new Date().getFullYear()} ShopVPS. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}
