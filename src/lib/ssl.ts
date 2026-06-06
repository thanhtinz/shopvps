// SSL Center helpers. Auto-issuance via Let's Encrypt (ACME DNS-01) is an
// extension point: it returns null unless a real ACME integration is wired,
// so orders fall back to manual/admin issuance (as WHMCS does for paid certs).
export async function tryAutoIssue(_order: { commonName: string; provider: string }): Promise<{ certificate: string; caBundle?: string; expiresAt: Date } | null> {
  // Hook for acme-client (DNS-01 via the registrar DNS manager). Not enabled by
  // default to avoid shipping untested certificate automation.
  return null;
}
