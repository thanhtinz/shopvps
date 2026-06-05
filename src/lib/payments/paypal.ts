import { translate } from "@/lib/i18n/dictionaries";
import type { GatewayModule } from "./types";

// PayPal base URL for the configured environment.
export function paypalBase(config: any): string {
  return config?.mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export async function paypalToken(config: any): Promise<string> {
  const base = paypalBase(config);
  const auth = Buffer.from(`${config.clientId}:${config.secret}`).toString("base64");
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error("PayPal auth thất bại");
  return data.access_token;
}

// PayPal Orders v2 via REST. Requires config: { clientId, secret, mode }.
// Credited by /api/payments/paypal/capture on return.
export const paypalGateway: GatewayModule = {
  code: "paypal",
  label: "PayPal",
  auto: true,
  createsPendingTxn: true,
  async initiate(ctx) {
    const t = (k: string) => translate(ctx.locale, k);
    if (!ctx.config?.clientId || !ctx.config?.secret) throw new Error(t("PayPal chưa được cấu hình"));
    const base = paypalBase(ctx.config);
    const token = await paypalToken(ctx.config);
    const value = ctx.amountCurrency.toFixed(ctx.currency.decimals);
    const res = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ custom_id: ctx.reference, amount: { currency_code: ctx.currency.code, value } }],
        application_context: {
          brand_name: "ShopVPS",
          user_action: "PAY_NOW",
          return_url: `${ctx.appUrl}/api/payments/paypal/capture`,
          cancel_url: `${ctx.appUrl}/wallet?deposit=cancel`,
        },
      }),
    });
    const data = await res.json();
    const approve = data?.links?.find((l: any) => l.rel === "approve")?.href;
    if (!res.ok || !approve) throw new Error(data?.message || t("Không tạo được đơn PayPal"));
    return { kind: "redirect", url: approve };
  },
};
