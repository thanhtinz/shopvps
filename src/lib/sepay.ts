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

// Verify webhook signature from SePay
export function verifySePayWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return hmac === signature;
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
