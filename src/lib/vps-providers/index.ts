export interface VpsProviderAPI {
  createServer(params: CreateServerParams): Promise<ServerInfo>;
  deleteServer(serverId: string): Promise<void>;
  powerOn(serverId: string): Promise<void>;
  powerOff(serverId: string): Promise<void>;
  reboot(serverId: string): Promise<void>;
  rebuild(serverId: string, osId: string): Promise<void>;
  changePassword(serverId: string, password: string): Promise<void>;
  getServerInfo(serverId: string): Promise<ServerInfo>;
  listOsImages(): Promise<OsImage[]>;
}

export interface CreateServerParams {
  hostname: string;
  planId: string;
  regionId: string;
  osId: string;
  password?: string;
}

export interface ServerInfo {
  id: string;
  hostname: string;
  ipAddress: string;
  status: string;
  os: string;
  ram: number;
  cpu: number;
  storage: number;
}

export interface OsImage {
  id: string;
  name: string;
  family: string;
}

// Factory function
export function getVpsProvider(slug: string, apiKey: string): VpsProviderAPI {
  switch (slug) {
    case "vultr":
      const { VultrProvider } = require("./vultr");
      return new VultrProvider(apiKey);
    case "hetzner":
      const { HetznerProvider } = require("./hetzner");
      return new HetznerProvider(apiKey);
    case "digitalocean":
      const { DigitalOceanProvider } = require("./digitalocean");
      return new DigitalOceanProvider(apiKey);
    default:
      throw new Error(`Unknown provider: ${slug}`);
  }
}
