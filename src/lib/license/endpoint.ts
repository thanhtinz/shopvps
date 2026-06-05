// Runtime service configuration.
const SVC = "aHR0cHM6Ly9saWNlbnNlLnlvdXJkb21haW4uY29t";

export function getLicenseEndpoint(): string {
  const o = process.env.LS_ENDPOINT;
  if (o && o.trim()) return o.trim();
  return Buffer.from(SVC, "base64").toString("utf8");
}
