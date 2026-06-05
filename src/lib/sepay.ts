import crypto from "crypto";

export interface SePayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  code: string | null;
  content: string;
  transferType: "in" | "out";
  transferAmount: number;
  accumulated: number;
  referenceCode: string;
  description: string;
}

// Verify webhook signature from SePay (timing-safe comparison)
export function verifySePayWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature || "", "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Parse deposit reference from transaction content
// Convention: "SHOPVPS {userId}" in transfer content
export function parseDepositReference(content: string): string | null {
  const match = content.match(/SHOPVPS\s+([A-Za-z0-9]+)/i);
  return match ? match[1] : null;
}

// Generate VietQR URL for payment
export function generateVietQRUrl(params: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
}): string {
  const { bankCode, accountNumber, accountName, amount, description } = params;
  return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;
}
