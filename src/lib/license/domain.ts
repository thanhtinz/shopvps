// Resolve the domain reported to the license server. The operator can pin it
// exactly with LICENSE_DOMAIN (must match what was stored on the dashboard);
// otherwise we derive it from the forwarded/host header and normalise it
// (strip port + trailing dot, lowercase) so a host-case difference doesn't
// cause a false DOMAIN_MISMATCH.
export function resolveLicenseDomain(req: Request): string {
  const override = (process.env.LICENSE_DOMAIN || "").trim();
  if (override) return override;
  const fwd = (req.headers.get("x-forwarded-host") || "").split(",")[0].trim();
  const host = fwd || req.headers.get("host") || "localhost";
  return host.replace(/:\d+$/, "").replace(/\.$/, "").toLowerCase();
}
