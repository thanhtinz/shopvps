// Runtime service configuration.
const SVC = "aHR0cHM6Ly9saW5jZW5zZWRhc2hib2FyZC1wcm9kdWN0aW9uLnVwLnJhaWx3YXkuYXBw";

export function getLicenseEndpoint(): string {
  const o = process.env.LS_ENDPOINT;
  if (o && o.trim()) return o.trim();
  return Buffer.from(SVC, "base64").toString("utf8");
}
