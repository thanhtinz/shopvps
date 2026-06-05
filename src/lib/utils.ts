import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Number of months in each billing cycle. */
export const CYCLE_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };

/** Return a copy of `base` advanced by `months` months. */
export function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Extend from the current expiry when it is still in the future, else from now. */
export function nextExpiry(currentExpiry: Date | null | undefined, months: number, now: Date = new Date()): Date {
  const from = currentExpiry && currentExpiry > now ? new Date(currentExpiry) : new Date(now);
  return addMonths(from, months);
}

/**
 * Prorated charge when switching plans mid-term: the per-cycle price difference
 * scaled by the unused fraction of the current term. Positive = upgrade (charge),
 * zero/negative = downgrade (no charge). Rounded to a whole currency unit.
 */
export function proratedDifference(opts: {
  oldMonthly: number; newMonthly: number; months: number; expiresAt: Date | null; now?: Date;
}): number {
  const now = opts.now ?? new Date();
  const termDays = opts.months * 30;
  let remainingDays = opts.expiresAt ? (opts.expiresAt.getTime() - now.getTime()) / 86400000 : 0;
  remainingDays = Math.max(0, Math.min(remainingDays, termDays));
  const fraction = termDays > 0 ? remainingDays / termDays : 0;
  const diffPerTerm = (opts.newMonthly - opts.oldMonthly) * opts.months;
  return Math.round(diffPerTerm * fraction);
}

/**
 * Whitelist-pick only the allowed keys from an (untrusted) request body.
 * Prevents mass-assignment of fields the client should not control.
 */
export function pick<T extends Record<string, any>>(
  obj: T | null | undefined,
  keys: readonly string[]
): Record<string, any> {
  const out: Record<string, any> = {};
  if (!obj || typeof obj !== "object") return out;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) {
      out[k] = obj[k];
    }
  }
  return out;
}

export function formatCurrency(amount: number | string | null): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `INV-${year}${month}-${random}`;
}

export function slugify(text: string): string {
  const base = (text || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip diacritics (incl. Vietnamese)
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "muc"}-${suffix}`;
}

export function generateAffiliateCode(length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getBillingCycleLabel(cycle: string): string {
  const labels: Record<string, string> = {
    MONTHLY: "1 tháng",
    QUARTERLY: "3 tháng",
    SEMI_ANNUAL: "6 tháng",
    ANNUAL: "1 năm",
  };
  return labels[cycle] || cycle;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "text-green-500",
    PENDING: "text-yellow-500",
    SUSPENDED: "text-orange-500",
    TERMINATED: "text-red-500",
    REBUILDING: "text-blue-500",
    PAID: "text-green-500",
    UNPAID: "text-red-500",
    OPEN: "text-blue-500",
    IN_PROGRESS: "text-yellow-500",
    CLOSED: "text-gray-500",
  };
  return colors[status] || "text-gray-500";
}
