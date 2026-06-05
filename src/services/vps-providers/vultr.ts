import type { VpsProviderInterface, VpsPlan, VpsOS, VpsRegion, CreateInstanceParams, VpsInstance, BandwidthUsage } from "./types";

export class VultrProvider implements VpsProviderInterface {
  private baseUrl = "https://api.vultr.com/v2";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Vultr API error: ${res.status} ${res.statusText}`);
    return method === "DELETE" ? ({} as T) : res.json();
  }

  async listPlans(): Promise<VpsPlan[]> {
    const data = await this.request<{ plans: any[] }>("/plans?type=vc2");
    return data.plans.map((p) => ({
      id: p.id, name: p.id,
      cpu: p.vcpu_count, ram: p.ram,
      storage: p.disk, bandwidth: p.bandwidth,
      priceMonthly: p.monthly_cost,
    }));
  }

  async listOS(): Promise<VpsOS[]> {
    const data = await this.request<{ os: any[] }>("/os");
    return data.os.map((o) => ({
      id: String(o.id), name: o.name,
      version: o.name, arch: o.arch,
    }));
  }

  async listRegions(): Promise<VpsRegion[]> {
    const data = await this.request<{ regions: any[] }>("/regions");
    return data.regions.map((r) => ({
      id: r.id, name: r.city, country: r.country,
    }));
  }

  async createInstance(params: CreateInstanceParams): Promise<VpsInstance> {
    const data = await this.request<{ instance: any }>("/instances", "POST", {
      region: params.regionId,
      plan: params.planId,
      os_id: Number(params.osId),
      label: params.label,
      hostname: params.hostname,
      enable_ipv6: params.enableIpv6 ?? false,
    });
    return this.mapInstance(data.instance);
  }

  async getInstance(id: string): Promise<VpsInstance> {
    const data = await this.request<{ instance: any }>(`/instances/${id}`);
    return this.mapInstance(data.instance);
  }

  async startInstance(id: string): Promise<void> {
    await this.request(`/instances/${id}/start`, "POST");
  }

  async stopInstance(id: string): Promise<void> {
    await this.request(`/instances/${id}/halt`, "POST");
  }

  async restartInstance(id: string): Promise<void> {
    await this.request(`/instances/${id}/reboot`, "POST");
  }

  async deleteInstance(id: string): Promise<void> {
    await this.request(`/instances/${id}`, "DELETE");
  }

  async rebuildInstance(id: string, osId: string): Promise<void> {
    await this.request(`/instances/${id}/reinstall`, "POST", { os_id: Number(osId) });
  }

  async changePassword(id: string): Promise<string> {
    // Vultr doesn't support direct password change via API; use reset
    await this.request(`/instances/${id}/restore`, "POST");
    return "Password reset initiated. Check email.";
  }

  async getBandwidthUsage(id: string): Promise<BandwidthUsage> {
    const data = await this.request<{ bandwidth: any }>(`/instances/${id}/bandwidth`);
    const bytes = Object.values(data.bandwidth || {}).reduce(
      (sum: number, day: any) => sum + (day.outgoing_bytes || 0), 0
    );
    return { used: Math.round((bytes as number) / 1e9), total: 0 };
  }

  private mapInstance(i: any): VpsInstance {
    return {
      id: i.id,
      status: i.power_status === "running" ? "running" : "stopped",
      ipv4: i.main_ip,
      ipv6: i.v6_main_ip,
      label: i.label,
      hostname: i.hostname,
      os: i.os,
      ram: i.ram,
      cpu: i.vcpu_count,
      storage: i.disk,
      region: i.region,
      createdAt: new Date(i.date_created),
    };
  }
}
