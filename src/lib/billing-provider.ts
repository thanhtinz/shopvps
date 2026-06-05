import { prisma } from "@/lib/prisma";
import { getVpsProvider } from "@/lib/vps-providers";
import { getWHMClient } from "@/lib/whm";
import { decrypt } from "@/lib/encrypt";

// Provider-side service actions for the billing lifecycle. All are best-effort:
// failures are logged but never thrown, so a provider outage can't block the
// billing run or a wallet payment.

type VpsAction = "powerOff" | "powerOn" | "deleteServer";

async function vpsAction(orderId: string, action: VpsAction) {
  try {
    const order = await prisma.vpsOrder.findUnique({ where: { id: orderId }, include: { provider: true } });
    if (!order || !order.provider?.apiKey || !order.providerVpsId) return;
    const provider = getVpsProvider(order.provider.slug, decrypt(order.provider.apiKey));
    await provider[action](order.providerVpsId);
  } catch (e) {
    console.error(`[Billing] VPS ${action} failed for ${orderId}:`, e);
  }
}

export const suspendVpsAtProvider = (id: string) => vpsAction(id, "powerOff");
export const reactivateVpsAtProvider = (id: string) => vpsAction(id, "powerOn");
export const terminateVpsAtProvider = (id: string) => vpsAction(id, "deleteServer");

/** Resize the underlying VPS to a new provider plan (slug). Best-effort. */
export async function resizeVpsAtProvider(orderId: string, planId: string) {
  try {
    const order = await prisma.vpsOrder.findUnique({ where: { id: orderId }, include: { provider: true } });
    if (!order || !order.provider?.apiKey || !order.providerVpsId || !planId) return;
    const provider = getVpsProvider(order.provider.slug, decrypt(order.provider.apiKey));
    await provider.resizeServer(order.providerVpsId, planId);
  } catch (e) {
    console.error(`[Billing] VPS resize failed for ${orderId}:`, e);
  }
}

type WhmAction = "suspendAccount" | "unsuspendAccount" | "terminateAccount";

async function hostingAction(orderId: string, action: WhmAction, reason?: string) {
  try {
    const order = await prisma.hostingOrder.findUnique({ where: { id: orderId }, include: { server: true } });
    if (!order || !order.cpanelUsername) return;
    const whm = getWHMClient(order.server);
    if (action === "suspendAccount") await whm.suspendAccount(order.cpanelUsername, reason);
    else if (action === "unsuspendAccount") await whm.unsuspendAccount(order.cpanelUsername);
    else await whm.terminateAccount(order.cpanelUsername);
  } catch (e) {
    console.error(`[Billing] Hosting ${action} failed for ${orderId}:`, e);
  }
}

export const suspendHostingAtProvider = (id: string, reason?: string) => hostingAction(id, "suspendAccount", reason);
export const reactivateHostingAtProvider = (id: string) => hostingAction(id, "unsuspendAccount");
export const terminateHostingAtProvider = (id: string) => hostingAction(id, "terminateAccount");

/** Switch the cPanel account to a new WHM package (by plan name). Best-effort. */
export async function changeHostingPackageAtProvider(orderId: string, planName: string) {
  try {
    const order = await prisma.hostingOrder.findUnique({ where: { id: orderId }, include: { server: true } });
    if (!order || !order.cpanelUsername || !planName) return;
    const whm = getWHMClient(order.server);
    await whm.changePackage(order.cpanelUsername, planName);
  } catch (e) {
    console.error(`[Billing] Hosting changePackage failed for ${orderId}:`, e);
  }
}

/** Lift provider-side suspension for services reactivated by an invoice payment. */
export async function reactivateServices(reactivated: { vps: string[]; hosting: string[] }) {
  for (const id of reactivated.vps) await reactivateVpsAtProvider(id);
  for (const id of reactivated.hosting) await reactivateHostingAtProvider(id);
}
