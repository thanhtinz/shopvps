import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";

function isAdmin(s: any) { return s && ["ADMIN", "SUPER_ADMIN"].includes((s.user as any).role); }
const iso = (d: any) => (d ? new Date(d).toISOString() : "");

// CSV export for reconciliation: ?type=transactions|invoices|payouts&from=&to=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = new URL(req.url).searchParams;
  const type = sp.get("type") || "transactions";
  const from = sp.get("from") ? new Date(sp.get("from")!) : null;
  const to = sp.get("to") ? new Date(sp.get("to")!) : null;
  const createdAt: any = {};
  if (from && !isNaN(+from)) createdAt.gte = from;
  if (to && !isNaN(+to)) createdAt.lte = to;
  const where = Object.keys(createdAt).length ? { createdAt } : {};
  const stamp = new Date().toISOString().slice(0, 10);

  if (type === "invoices") {
    const rows = await prisma.invoice.findMany({ where, orderBy: { createdAt: "desc" }, take: 50000, include: { user: { select: { email: true } } } });
    const csv = toCsv(
      [
        { key: "invoiceNumber", label: "Invoice" }, { key: "createdAt", label: "Created" },
        { key: "email", label: "Customer" }, { key: "status", label: "Status" },
        { key: "subtotal", label: "Subtotal" }, { key: "discount", label: "Discount" },
        { key: "tax", label: "Tax" }, { key: "total", label: "Total" }, { key: "paidAt", label: "Paid at" },
      ],
      rows.map((r) => ({ invoiceNumber: r.invoiceNumber, createdAt: iso(r.createdAt), email: r.user?.email || "", status: r.status, subtotal: Number(r.subtotal), discount: Number(r.discount), tax: Number(r.tax), total: Number(r.total), paidAt: iso(r.paidAt) })),
    );
    return csvResponse(`invoices-${stamp}.csv`, csv);
  }

  if (type === "payouts") {
    const rows = await prisma.payout.findMany({ where, orderBy: { createdAt: "desc" }, take: 50000, include: { user: { select: { email: true } } } });
    const csv = toCsv(
      [
        { key: "id", label: "ID" }, { key: "createdAt", label: "Created" }, { key: "email", label: "Customer" },
        { key: "amount", label: "Amount" }, { key: "method", label: "Method" }, { key: "auto", label: "Auto" },
        { key: "status", label: "Status" }, { key: "destination", label: "Destination" }, { key: "processedAt", label: "Processed at" },
      ],
      rows.map((r) => ({ id: r.id, createdAt: iso(r.createdAt), email: r.user?.email || "", amount: Number(r.amount), method: r.method, auto: r.auto ? "yes" : "no", status: r.status, destination: r.destination || "", processedAt: iso(r.processedAt) })),
    );
    return csvResponse(`payouts-${stamp}.csv`, csv);
  }

  // default: transactions
  const rows = await prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" }, take: 50000, include: { user: { select: { email: true } } } });
  const csv = toCsv(
    [
      { key: "id", label: "ID" }, { key: "createdAt", label: "Created" }, { key: "email", label: "Customer" },
      { key: "type", label: "Type" }, { key: "amount", label: "Amount" },
      { key: "balanceBefore", label: "Balance before" }, { key: "balanceAfter", label: "Balance after" },
      { key: "status", label: "Status" }, { key: "reference", label: "Reference" }, { key: "description", label: "Description" },
    ],
    rows.map((r) => ({ id: r.id, createdAt: iso(r.createdAt), email: r.user?.email || "", type: r.type, amount: Number(r.amount), balanceBefore: Number(r.balanceBefore), balanceAfter: Number(r.balanceAfter), status: r.status, reference: r.reference || "", description: r.description || "" })),
  );
  return csvResponse(`transactions-${stamp}.csv`, csv);
}
