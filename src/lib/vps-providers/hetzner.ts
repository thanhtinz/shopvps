import axios from "axios";
import type { VpsProviderAPI, CreateServerParams, ServerInfo, OsImage } from "./index";

const BASE_URL = "https://api.hetzner.cloud/v1";

export class HetznerProvider implements VpsProviderAPI {
  private client;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }

  async createServer(params: CreateServerParams): Promise<ServerInfo> {
    const { data } = await this.client.post("/servers", {
      name: params.hostname,
      server_type: params.planId,
      location: params.regionId,
      image: params.osId,
    });
    return this.mapServer(data.server);
  }

  async deleteServer(serverId: string): Promise<void> {
    await this.client.delete(`/servers/${serverId}`);
  }

  async powerOn(serverId: string): Promise<void> {
    await this.client.post(`/servers/${serverId}/actions/poweron`);
  }

  async powerOff(serverId: string): Promise<void> {
    await this.client.post(`/servers/${serverId}/actions/poweroff`);
  }

  async reboot(serverId: string): Promise<void> {
    await this.client.post(`/servers/${serverId}/actions/reboot`);
  }

  async rebuild(serverId: string, osId: string): Promise<void> {
    await this.client.post(`/servers/${serverId}/actions/rebuild`, { image: osId });
  }

  async changePassword(serverId: string, password: string): Promise<void> {
    await this.client.post(`/servers/${serverId}/actions/reset_password`);
  }

  async getServerInfo(serverId: string): Promise<ServerInfo> {
    const { data } = await this.client.get(`/servers/${serverId}`);
    return this.mapServer(data.server);
  }

  async listOsImages(): Promise<OsImage[]> {
    const { data } = await this.client.get("/images?type=system");
    return data.images.map((img: any) => ({
      id: img.name,
      name: img.description,
      family: img.os_flavor,
    }));
  }

  private mapServer(server: any): ServerInfo {
    return {
      id: String(server.id),
      hostname: server.name,
      ipAddress: server.public_net?.ipv4?.ip || "",
      status: server.status,
      os: server.image?.description || "",
      ram: server.server_type?.memory || 0,
      cpu: server.server_type?.cores || 0,
      storage: server.server_type?.disk || 0,
    };
  }
}
