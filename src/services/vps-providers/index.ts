import { VultrProvider } from "./vultr";
import { HetznerProvider } from "./hetzner";
import type { VpsProviderInterface } from "./types";

export * from "./types";

export function getVpsProvider(slug: string, apiKey: string): VpsProviderInterface {
  switch (slug) {
    case "vultr":       return new VultrProvider(apiKey);
    case "hetzner":     return new HetznerProvider(apiKey);
    // DigitalOcean, Linode, OVH, UpCloud — same pattern
    default: throw new Error(`Unknown VPS provider: ${slug}`);
  }
}
