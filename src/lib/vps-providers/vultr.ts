import axios from "axios";
import type { VpsProviderAPI, CreateServerParams, ServerInfo, OsImage } from "./index";

const BASE_URL = "https://api.vultr.com/v2";

export class VultrProvider implements VpsProviderAPI {
  private client;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }

  async createServer(params: CreateServerParams): Promise<ServerInfo> {
    const { data } = await this.client.post("/instances", {
      hostname: params.hostname,
      plan: params.planId,
      region: params.regionId,
      os_id: params.osId,
      password: params.password,
      user_data: params.userData ? Buffer.from(params.userData).toString("base64") : undefined,
    });
    return this.mapServer(data.instance);
  }

  async deleteServer(serverId: string): Promise<void> {
    await this.client.delete(`/instances/${serverId}`);
  }

  async powerOn(serverId: string): Promise<void> {
    await this.client.post(`/instances/${serverId}/start`);
  }

  async powerOff(serverId: string): Promise<void> {
    await this.client.post(`/instances/${serverId}/halt`);
  }

  async reboot(serverId: string): Promise<void> {
    await this.client.post(`/instances/${serverId}/reboot`);
  }

  async rebuild(serverId: string, osId: string): Promise<void> {
    await this.client.post(`/instances/${serverId}/reinstall`, { hostname: serverId });
  }

  async resizeServer(serverId: string, planId: string): Promise<void> {
    await this.client.patch(`/instances/${serverId}`, { plan: planId });
  }

  async changePassword(serverId: string, password: string): Promise<void> {
    // Vultr doesn't support direct password change via API — requires OS level
    throw new Error("Not supported by Vultr API directly");
  }

  async getServerInfo(serverId: string): Promise<ServerInfo> {
    const { data } = await this.client.get(`/instances/${serverId}`);
    return this.mapServer(data.instance);
  }

  async listOsImages(): Promise<OsImage[]> {
    const { data } = await this.client.get("/os");
    return data.os.map((os: any) => ({
      id: String(os.id),
      name: os.name,
      family: os.family,
    }));
  }

  private mapServer(instance: any): ServerInfo {
    return {
      id: instance.id,
      hostname: instance.hostname,
      ipAddress: instance.main_ip,
      status: instance.power_status,
      os: instance.os,
      ram: instance.ram,
      cpu: instance.vcpu_count,
      storage: instance.disk,
    };
  }
}
