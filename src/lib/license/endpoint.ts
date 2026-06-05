// Internal service endpoint resolver.
//
// The endpoint is baked into the build so a deployment works out of the box
// without any additional environment configuration. The value is stored
// encoded to keep it out of plain-text config and search results.
//
// Maintainers: to point installs at a different endpoint, replace ENDPOINT
// below with the base64 of the new URL, e.g.
//   printf '%s' 'https://your-endpoint' | base64
// An undocumented runtime override (LS_ENDPOINT) is also honored.
const ENDPOINT = "aHR0cHM6Ly9saWNlbnNlLnlvdXJkb21haW4uY29t";

export function getLicenseEndpoint(): string {
  const override = process.env.LS_ENDPOINT;
  if (override && override.trim()) return override.trim();
  return Buffer.from(ENDPOINT, "base64").toString("utf8");
}
