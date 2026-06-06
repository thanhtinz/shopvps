import { getSettings } from "@/lib/settings";
import { getRegistrar } from "@/lib/registrars";

// SSL Center helpers. Automatic issuance uses Let's Encrypt over ACME with the
// DNS-01 challenge, fulfilled through the registrar DNS manager. It is wired via
// a dynamic import of `acme-client` so the build never hard-depends on it: if the
// package isn't installed (or anything fails) it returns null and the order
// falls back to manual issuance.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface IssueResult { certificate: string; caBundle?: string; privateKey?: string; expiresAt: Date }

/** Split a full PEM chain into the leaf certificate and the CA bundle. */
function splitChain(pem: string): { certificate: string; caBundle?: string } {
  const blocks = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
  if (blocks.length <= 1) return { certificate: pem.trim() };
  return { certificate: blocks[0]!.trim(), caBundle: blocks.slice(1).join("\n").trim() };
}

/**
 * Issue a Let's Encrypt certificate for the order's domain via ACME DNS-01.
 * Returns null when not enabled/possible (manual fallback). May take a minute+
 * (DNS propagation), so callers should run it from an admin action, not a request.
 */
export async function autoIssueLetsEncrypt(order: { commonName: string; csr?: string | null }): Promise<IssueResult | null> {
  const s = await getSettings(["acme_enabled", "acme_email", "acme_directory"]);
  if (s.acme_enabled !== "true" || !s.acme_email) return null;

  // The registrar must manage this domain's DNS for the DNS-01 challenge.
  const reg = await getRegistrar();
  if (!reg || !reg.addDns || !reg.deleteDns || !reg.listDns) return null;
  const domain = order.commonName;

  let acme: any;
  // Non-literal specifier so the build doesn't require the optional dependency.
  const acmeModule = "acme-client";
  try { acme = await import(/* webpackIgnore: true */ acmeModule); } catch { return null; } // not installed → manual
  const crypto = acme.crypto || acme.forge; // v5 = crypto, v4 = forge
  if (!crypto) return null;

  try {
    const accountKey = await crypto.createPrivateKey();
    const directoryUrl = s.acme_directory || acme.directory.letsencrypt.production;
    const client = new acme.Client({ directoryUrl, accountKey });

    let csr: any = order.csr || null;
    let privateKeyPem: string | undefined;
    if (!csr) {
      const [key, generatedCsr] = await crypto.createCsr({ commonName: domain });
      csr = generatedCsr;
      privateKeyPem = key.toString();
    }

    const challengeHost = `_acme-challenge.${domain}`;
    const cert: string = await client.auto({
      csr,
      email: s.acme_email,
      termsOfServiceAgreed: true,
      challengePriority: ["dns-01"],
      challengeCreateFn: async (_authz: any, challenge: any, keyAuthorization: string) => {
        if (challenge.type !== "dns-01") return;
        await reg.addDns!(domain, { type: "TXT", host: challengeHost, value: keyAuthorization, ttl: 120 });
        await sleep(20000); // allow DNS propagation before LE validates
      },
      challengeRemoveFn: async (_authz: any, challenge: any) => {
        if (challenge.type !== "dns-01") return;
        try {
          const recs = await reg.listDns!(domain);
          const m = recs.find((r) => r.type === "TXT" && r.host.includes("_acme-challenge"));
          if (m) await reg.deleteDns!(domain, m.id);
        } catch { /* best-effort cleanup */ }
      },
    });

    const certStr = cert.toString();
    const { certificate, caBundle } = splitChain(certStr);
    let expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    try { const info = crypto.readCertificateInfo ? await crypto.readCertificateInfo(certStr) : null; if (info?.notAfter) expiresAt = new Date(info.notAfter); } catch { /* keep default */ }

    return { certificate, caBundle, privateKey: privateKeyPem, expiresAt };
  } catch (e) {
    console.error("ACME auto-issue error:", e);
    return null;
  }
}

/** Hook used at order time; kept a no-op (issuance is admin-triggered to avoid
 *  blocking the purchase request on DNS propagation). */
export async function tryAutoIssue(_order: { commonName: string; provider: string }): Promise<{ certificate: string; caBundle?: string; expiresAt: Date } | null> {
  return null;
}
