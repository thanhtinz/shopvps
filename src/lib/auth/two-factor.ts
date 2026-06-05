import speakeasy from "speakeasy";
import QRCode from "qrcode";

export function generateTwoFactorSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `ShopVPS (${email})`,
    issuer: "ShopVPS",
    length: 32,
  });
  return secret;
}

export async function generateQRCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
}
