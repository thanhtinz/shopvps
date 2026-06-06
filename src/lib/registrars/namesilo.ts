import type { RegistrarAPI, RegisterResult } from "./types";

/**
 * Namesilo registrar (HTTP API, JSON mode). Uses the account's default
 * registrant contact, so no per-order contact is required. Reply code "300"
 * means success.
 */
export class NamesiloRegistrar implements RegistrarAPI {
  private base: string;
  constructor(private apiKey: string, sandbox = false) {
    this.base = sandbox ? "https://sandbox.namesilo.com/api" : "https://www.namesilo.com/api";
  }

  private async call(op: string, params: Record<string, string>): Promise<any> {
    const qs = new URLSearchParams({ version: "1", type: "json", key: this.apiKey, ...params });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(`${this.base}/${op}?${qs.toString()}`, { signal: ctrl.signal });
      const json = await res.json();
      return json?.reply ?? {};
    } finally {
      clearTimeout(timer);
    }
  }

  private addYears(years: number): Date {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  async checkAvailability(domain: string): Promise<boolean | null> {
    try {
      const reply = await this.call("checkRegisterAvailability", { domains: domain });
      if (reply?.available) {
        const list = Array.isArray(reply.available.domain) ? reply.available.domain : [reply.available.domain];
        if (list.some((d: any) => (typeof d === "string" ? d : d?.domain) === domain)) return true;
      }
      if (reply?.unavailable) {
        const list = Array.isArray(reply.unavailable.domain) ? reply.unavailable.domain : [reply.unavailable.domain];
        if (list.some((d: any) => (typeof d === "string" ? d : d?.domain) === domain)) return false;
      }
      return null;
    } catch {
      return null;
    }
  }

  async register(domain: string, years: number, nameservers?: string[]): Promise<RegisterResult> {
    const params: Record<string, string> = { domain, years: String(years), private: "1" };
    (nameservers || []).slice(0, 13).forEach((ns, i) => { params[`ns${i + 1}`] = ns; });
    const reply = await this.call("registerDomain", params);
    const ok = reply?.code === "300" || reply?.code === 300;
    return { ok, expiresAt: ok ? this.addYears(years) : undefined, message: reply?.detail };
  }

  async renew(domain: string, years: number): Promise<RegisterResult> {
    const reply = await this.call("renewDomain", { domain, years: String(years) });
    const ok = reply?.code === "300" || reply?.code === 300;
    return { ok, expiresAt: ok ? this.addYears(years) : undefined, message: reply?.detail };
  }

  async transfer(domain: string, years: number, authCode: string): Promise<RegisterResult> {
    const reply = await this.call("transferDomain", { domain, auth: authCode, years: String(years) });
    // Transfers complete asynchronously; 300/301 both indicate the request was accepted.
    const ok = ["300", "301", 300, 301].includes(reply?.code);
    return { ok, message: reply?.detail };
  }
}
