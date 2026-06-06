import { getSettings } from "@/lib/settings";

// Best-effort Pterodactyl/Pelican Application-API client. Used to auto-provision
// game servers; when the panel isn't configured, callers fall back to manual.

export interface PanelConfig { url: string; key: string; userId: number; locationId: number; }

export async function getPanelConfig(): Promise<PanelConfig | null> {
  const s = await getSettings(["panel_url", "panel_api_key", "panel_user_id", "panel_location_id"]);
  if (!s.panel_url || !s.panel_api_key) return null;
  return {
    url: s.panel_url.replace(/\/$/, ""),
    key: s.panel_api_key,
    userId: parseInt(s.panel_user_id || "1", 10) || 1,
    locationId: parseInt(s.panel_location_id || "1", 10) || 1,
  };
}

async function call(cfg: PanelConfig, method: string, path: string, body?: any): Promise<any> {
  const res = await fetch(`${cfg.url}/api/application${path}`, {
    method,
    headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Panel ${method} ${path} -> ${res.status}`);
  return res.status === 204 ? {} : res.json();
}

export interface CreateGameServer {
  name: string; eggId: number; dockerImage?: string; memory: number; env?: Record<string, string>;
}

/** Create a game server on the panel and return its id + login URL. */
export async function panelCreateServer(cfg: PanelConfig, p: CreateGameServer): Promise<{ id: number; identifier: string; url: string }> {
  const data = await call(cfg, "POST", "/servers", {
    name: p.name,
    user: cfg.userId,
    egg: p.eggId,
    docker_image: p.dockerImage || undefined,
    startup: "{{STARTUP}}",
    environment: p.env || {},
    limits: { memory: p.memory, swap: 0, disk: Math.max(2048, p.memory * 2), io: 500, cpu: 0 },
    feature_limits: { databases: 1, allocations: 1, backups: 2 },
    deploy: { locations: [cfg.locationId], dedicated_ip: false, port_range: [] },
    start_on_completion: true,
  });
  const attr = data?.attributes || {};
  return { id: attr.id, identifier: attr.identifier, url: `${cfg.url}/server/${attr.identifier}` };
}

export async function panelSuspend(cfg: PanelConfig, id: number): Promise<void> { await call(cfg, "POST", `/servers/${id}/suspend`); }
export async function panelUnsuspend(cfg: PanelConfig, id: number): Promise<void> { await call(cfg, "POST", `/servers/${id}/unsuspend`); }
export async function panelDelete(cfg: PanelConfig, id: number): Promise<void> { await call(cfg, "DELETE", `/servers/${id}`); }
