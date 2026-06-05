import type { GatewayModule } from "./types";

// Stripe Checkout via the REST API (no SDK dependency). Requires config:
// { secretKey, webhookSecret }. Credited by /api/webhook/stripe.
export const stripeGateway: GatewayModule = {
  code: "stripe",
  label: "Thẻ quốc tế (Stripe)",
  auto: true,
  createsPendingTxn: true,
  async initiate(ctx) {
    const secret = ctx.config?.secretKey;
    if (!secret) throw new Error("Stripe chưa được cấu hình");

    const unit = Math.round(ctx.amountCurrency * Math.pow(10, ctx.currency.decimals));
    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("success_url", `${ctx.appUrl}/wallet?deposit=success`);
    body.set("cancel_url", `${ctx.appUrl}/wallet?deposit=cancel`);
    body.set("client_reference_id", ctx.reference);
    body.set("customer_email", ctx.userEmail);
    body.set("metadata[reference]", ctx.reference);
    body.set("line_items[0][quantity]", "1");
    body.set("line_items[0][price_data][currency]", ctx.currency.code.toLowerCase());
    body.set("line_items[0][price_data][unit_amount]", String(unit));
    body.set("line_items[0][price_data][product_data][name]", "Nạp tiền tài khoản");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await res.json();
    if (!res.ok || !data.url) throw new Error(data?.error?.message || "Không tạo được phiên Stripe");
    return { kind: "redirect", url: data.url };
  },
};
