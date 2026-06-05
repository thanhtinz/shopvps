import type { Currency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/dictionaries";

export interface InitiateContext {
  reference: string;
  amountBase: number;     // amount in base currency (e.g. VND)
  amountCurrency: number; // amount in the selected currency
  currency: Currency;
  userId: string;
  userEmail: string;
  appUrl: string;
  config: any;            // parsed gateway config (credentials/settings)
  locale: Locale;         // recipient interface language for user-facing copy
}

export type InitiateResult =
  | { kind: "redirect"; url: string }
  | { kind: "instructions"; title: string; lines: { label: string; value: string }[]; note?: string; qrUrl?: string | null };

export interface GatewayModule {
  code: string;
  label: string;
  // Auto-credit via webhook/capture (stripe/paypal/sepay) vs admin-confirmed (manual).
  auto: boolean;
  // Whether the deposit flow pre-creates a PENDING transaction keyed by our
  // reference. SePay reconciles by transfer content instead, so it opts out.
  createsPendingTxn: boolean;
  initiate(ctx: InitiateContext): Promise<InitiateResult>;
}
