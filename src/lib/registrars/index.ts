import { getSettings } from "@/lib/settings";
import { checkAvailability as rdapCheck } from "@/lib/domains";
import type { RegistrarAPI } from "./types";
import { NamesiloRegistrar } from "./namesilo";

export type { RegistrarAPI, RegisterResult } from "./types";

/**
 * Build the configured registrar from settings, or null when running in manual
 * mode (admin fulfils orders by hand). Settings keys:
 *   registrar            = "namesilo" | "manual" (default manual)
 *   registrar_api_key    = API credential
 *   registrar_sandbox    = "true" to hit the sandbox endpoint
 */
export async function getRegistrar(): Promise<RegistrarAPI | null> {
  const s = await getSettings(["registrar", "registrar_api_key", "registrar_sandbox"]);
  const code = (s.registrar || "manual").toLowerCase();
  const key = s.registrar_api_key || "";
  const sandbox = s.registrar_sandbox === "true";
  if (code === "namesilo" && key) return new NamesiloRegistrar(key, sandbox);
  return null;
}

/** Availability via the configured registrar, falling back to public RDAP. */
export async function checkDomainAvailability(domain: string): Promise<boolean | null> {
  const reg = await getRegistrar();
  if (reg) {
    const res = await reg.checkAvailability(domain);
    if (res !== null) return res;
  }
  return rdapCheck(domain);
}
