import nodemailer from "nodemailer";
import { translate, Locale } from "@/lib/i18n/dictionaries";

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

export async function sendEmail({ to, subject, html }: EmailOptions) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "ShopVPS <noreply@shopvps.com>",
    to,
    subject,
    html,
  });
}

export function verifyEmailTemplate(name: string, url: string, locale: Locale = "vi"): string {
  const t = (k: string) => translate(locale, k);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">ShopVPS</h1>
      </div>
      <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1f2937;">${t("Xác thực email của bạn")}</h2>
        <p style="color: #6b7280;">${t("Xin chào")} <strong>${name}</strong>,</p>
        <p style="color: #6b7280;">${t("Nhấn vào nút bên dưới để xác thực email và kích hoạt tài khoản.")}</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${url}" style="background: #667eea; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            ${t("Xác thực email")}
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">${t("Link có hiệu lực trong 24 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.")}</p>
      </div>
    </div>
  `;
}

export function resetPasswordTemplate(name: string, url: string, locale: Locale = "vi"): string {
  const t = (k: string) => translate(locale, k);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">ShopVPS</h1>
      </div>
      <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1f2937;">${t("Đặt lại mật khẩu")}</h2>
        <p style="color: #6b7280;">${t("Xin chào")} <strong>${name}</strong>,</p>
        <p style="color: #6b7280;">${t("Nhấn vào nút bên dưới để đặt lại mật khẩu của bạn.")}</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${url}" style="background: #ef4444; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            ${t("Đặt lại mật khẩu")}
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">${t("Link có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.")}</p>
      </div>
    </div>
  `;
}
