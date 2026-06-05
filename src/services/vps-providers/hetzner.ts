import type { VpsProviderInterface, VpsPlan, VpsOS, VpsRegion, CreateInstanceParams, VpsInstance, BandwidthUsage } from "./types";

export class HetznerProvider implements VpsProviderInterface {
  private baseUrl = "https://api.hetzner.cloud/v1";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Hetzner API error: ${res.status}`);
    return method === "DELETE" ? ({} as T) : res.json();
  }

  async listPlans(): Promise<VpsPlan[]> {
    const data = await this.request<{ server_types: any[] }>("/server_types");
    return data.server_types.map((p) => ({
      id: String(p.id), name: p.name,
      cpu: p.cores, ram: p.memory * 1024,
      storage: p.disk, bandwidth: p.included_traffic / 1e9,
      priceMonthly: parseFloat(p.prices?.[0]?.price_monthly?.gross ?? "0"),
    }));
  }

  async listOS(): Promise<VpsOS[]> {
    const data = await this.request<{ images: any[] }>("/images?type=system");
    return data.images.map((o) => ({
      id: String(o.id), name: o.description,
      version: o.os_version ?? "", arch: o.architecture,
    }));
  }

  async listRegions(): Promise<VpsRegion[]> {
    const data = await this.request<{ locations: any[] }>("/locations");
    return data.locations.map((r) => ({
      id: r.name, name: r.city, country: r.country,
    }));
  }

  async createInstance(params: CreateInstanceParams): Promise<VpsInstance> {
    const data = await this.request<{ server: any }>("/servers", "POST", {
      name: params.hostname,
      server_type: params.planId,
      image: params.osId,
      location: params.regionId,
      labels: { label: params.label },
    });
    return this.mapInstance(data.server);
  }

  async getInstance(id: string): Promise<VpsInstance> {
    const data = await this.request<{ server: any }>(`/servers/${id}`);
    return this.mapInstance(data.server);
  }

  async startInstance(id: string): Promise<void> {
    await this.request(`/servers/${id}/actions/poweron`, "POST");
  }

  async stopInstance(id: string): Promise<void> {
    await this.request(`/servers/${id}/actions/poweroff`, "POST");
  }

  async restartInstance(id: string): Promise<void> {
    await this.request(`/servers/${id}/actions/reboot`, "POST");
  }

  async deleteInstance(id: string): Promise<void> {
    await this.request(`/servers/${id}`, "DELETE");
  }

  async rebuildInstance(id: string, osId: string): Promise<void> {
    await this.request(`/servers/${id}/actions/rebuild`, "POST", { image: osId });
  }

  async changePassword(id: string): Promise<string> {
    const data = await this.request<{ root_password: string }>(`/servers/${id}/actions/reset_password`, "POST");
    return data.root_password;
  }

  async getBandwidthUsage(id: string): Promise<BandwidthUsage> {
    const data = await this.request<{ server: any }>(`/servers/${id}`);
    const used = (data.server.outgoing_traffic ?? 0) / 1e9;
    const total = (data.server.included_traffic ?? 0) / 1e9;
    return { used: Math.round(used), total: Math.round(total) };
  }

  private mapInstance(s: any): VpsInstance {
    return {
      id: String(s.id),
      status: s.status === "running" ? "running" : s.status === "off" ? "stopped" : "pending",
      ipv4: s.public_net?.ipv4?.ip ?? "",
      ipv6: s.public_net?.ipv6?.ip,
      label: s.labels?.label ?? s.name,
      hostname: s.name,
      os: s.image?.description ?? "",
      ram: (s.server_type?.memory ?? 0) * 1024,
      cpu: s.server_type?.cores ?? 0,
      storage: s.server_type?.disk ?? 0,
      region: s.datacenter?.location?.name ?? "",
      createdAt: new Date(s.created),
    };
  }
}
