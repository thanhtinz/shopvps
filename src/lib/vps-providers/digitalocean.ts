import axios from "axios";
import type { VpsProviderAPI, CreateServerParams, ServerInfo, OsImage } from "./index";

const BASE_URL = "https://api.digitalocean.com/v2";

export class DigitalOceanProvider implements VpsProviderAPI {
  private client;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }

  async createServer(params: CreateServerParams): Promise<ServerInfo> {
    const { data } = await this.client.post("/droplets", {
      name: params.hostname,
      size: params.planId,
      region: params.regionId,
      image: params.osId,
    });
    return this.mapServer(data.droplet);
  }

  async deleteServer(serverId: string): Promise<void> {
    await this.client.delete(`/droplets/${serverId}`);
  }

  async powerOn(serverId: string): Promise<void> {
    await this.client.post(`/droplets/${serverId}/actions`, { type: "power_on" });
  }

  async powerOff(serverId: string): Promise<void> {
    await this.client.post(`/droplets/${serverId}/actions`, { type: "power_off" });
  }

  async reboot(serverId: string): Promise<void> {
    await this.client.post(`/droplets/${serverId}/actions`, { type: "reboot" });
  }

  async rebuild(serverId: string, osId: string): Promise<void> {
    await this.client.post(`/droplets/${serverId}/actions`, {
      type: "rebuild",
      image: osId,
    });
  }

  async changePassword(serverId: string, password: string): Promise<void> {
    await this.client.post(`/droplets/${serverId}/actions`, { type: "password_reset" });
  }

  async getServerInfo(serverId: string): Promise<ServerInfo> {
    const { data } = await this.client.get(`/droplets/${serverId}`);
    return this.mapServer(data.droplet);
  }

  async listOsImages(): Promise<OsImage[]> {
    const { data } = await this.client.get("/images?type=distribution");
    return data.images.map((img: any) => ({
      id: String(img.id),
      name: img.name,
      family: img.distribution,
    }));
  }

  private mapServer(droplet: any): ServerInfo {
    const ipv4 = droplet.networks?.v4?.find((n: any) => n.type === "public");
    return {
      id: String(droplet.id),
      hostname: droplet.name,
      ipAddress: ipv4?.ip_address || "",
      status: droplet.status,
      os: droplet.image?.name || "",
      ram: droplet.memory,
      cpu: droplet.vcpus,
      storage: droplet.disk,
    };
  }
}
