export interface VpsProviderInterface {
  listPlans(): Promise<VpsPlan[]>;
  listOS(): Promise<VpsOS[]>;
  listRegions(): Promise<VpsRegion[]>;
  createInstance(params: CreateInstanceParams): Promise<VpsInstance>;
  getInstance(id: string): Promise<VpsInstance>;
  startInstance(id: string): Promise<void>;
  stopInstance(id: string): Promise<void>;
  restartInstance(id: string): Promise<void>;
  deleteInstance(id: string): Promise<void>;
  rebuildInstance(id: string, osId: string): Promise<void>;
  changePassword(id: string): Promise<string>; // returns new root password
  getBandwidthUsage(id: string): Promise<BandwidthUsage>;
}

export interface VpsPlan {
  id: string;
  name: string;
  cpu: number;
  ram: number; // MB
  storage: number; // GB
  bandwidth: number; // GB
  priceMonthly: number;
}

export interface VpsOS {
  id: string;
  name: string;
  version: string;
  arch: string;
}

export interface VpsRegion {
  id: string;
  name: string;
  country: string;
}

export interface CreateInstanceParams {
  planId: string;
  osId: string;
  regionId: string;
  label: string;
  hostname: string;
  enableIpv6?: boolean;
  sshKeyIds?: string[];
}

export interface VpsInstance {
  id: string;
  status: "running" | "stopped" | "pending" | "rebuilding";
  ipv4: string;
  ipv6?: string;
  label: string;
  hostname: string;
  os: string;
  ram: number;
  cpu: number;
  storage: number;
  region: string;
  createdAt: Date;
}

export interface BandwidthUsage {
  used: number; // GB
  total: number; // GB
}
