import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
