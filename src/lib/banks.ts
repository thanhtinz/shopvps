// Vietnamese banks (Napas BIN for VietQR). Pure data — safe to import on client.
export interface VnBank { code: string; name: string; shortName: string; bin: string }

export const VN_BANKS: VnBank[] = [
  { code: "VCB", name: "Vietcombank", shortName: "Vietcombank", bin: "970436" },
  { code: "TCB", name: "Techcombank", shortName: "Techcombank", bin: "970407" },
  { code: "BIDV", name: "BIDV", shortName: "BIDV", bin: "970418" },
  { code: "CTG", name: "VietinBank", shortName: "VietinBank", bin: "970415" },
  { code: "AGRI", name: "Agribank", shortName: "Agribank", bin: "970405" },
  { code: "MB", name: "MB Bank", shortName: "MBBank", bin: "970422" },
  { code: "ACB", name: "ACB", shortName: "ACB", bin: "970416" },
  { code: "VPB", name: "VPBank", shortName: "VPBank", bin: "970432" },
  { code: "TPB", name: "TPBank", shortName: "TPBank", bin: "970423" },
  { code: "STB", name: "Sacombank", shortName: "Sacombank", bin: "970403" },
  { code: "VIB", name: "VIB", shortName: "VIB", bin: "970441" },
  { code: "MSB", name: "MSB", shortName: "MSB", bin: "970426" },
  { code: "OCB", name: "OCB", shortName: "OCB", bin: "970448" },
  { code: "SHB", name: "SHB", shortName: "SHB", bin: "970443" },
  { code: "HDB", name: "HDBank", shortName: "HDBank", bin: "970437" },
  { code: "SEAB", name: "SeABank", shortName: "SeABank", bin: "970440" },
  { code: "EIB", name: "Eximbank", shortName: "Eximbank", bin: "970431" },
  { code: "SCB", name: "SCB", shortName: "SCB", bin: "970429" },
  { code: "NAB", name: "Nam A Bank", shortName: "NamABank", bin: "970428" },
  { code: "PVCB", name: "PVcomBank", shortName: "PVcomBank", bin: "970412" },
  { code: "LPB", name: "LPBank", shortName: "LPBank", bin: "970449" },
  { code: "ABB", name: "ABBANK", shortName: "ABBANK", bin: "970425" },
  { code: "BAB", name: "BacABank", shortName: "BacABank", bin: "970409" },
  { code: "VAB", name: "VietABank", shortName: "VietABank", bin: "970427" },
  { code: "NCB", name: "NCB", shortName: "NCB", bin: "970419" },
  { code: "KLB", name: "KienLongBank", shortName: "KienLongBank", bin: "970452" },
  { code: "VBB", name: "VietBank", shortName: "VietBank", bin: "970433" },
  { code: "BVB", name: "BVBank", shortName: "BVBank", bin: "970454" },
  { code: "CAKE", name: "CAKE by VPBank", shortName: "CAKE", bin: "546034" },
  { code: "TIMO", name: "Timo by BVBank", shortName: "Timo", bin: "963388" },
];

const BY_CODE = new Map(VN_BANKS.map((b) => [b.code, b]));
export function getBank(code: string): VnBank | undefined { return BY_CODE.get(code); }

/** Build a VietQR quick-link image URL for an admin to scan and pay. */
export function vietQrUrl(bin: string, account: string, amount?: number, name?: string, info?: string): string {
  const base = `https://img.vietqr.io/image/${bin}-${encodeURIComponent(account)}-compact2.png`;
  const qs = new URLSearchParams();
  if (amount && amount > 0) qs.set("amount", String(Math.round(amount)));
  if (info) qs.set("addInfo", info);
  if (name) qs.set("accountName", name);
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}
