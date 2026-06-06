// Domain registrar abstraction (mirrors src/lib/vps-providers).
export interface RegisterResult {
  ok: boolean;
  expiresAt?: Date;
  message?: string;
}

export interface DnsRecord {
  id: string;
  type: string; // A | AAAA | CNAME | MX | TXT | ...
  host: string; // subdomain or full host
  value: string;
  ttl: number;
  priority?: number; // MX distance
}

export interface RegistrarAPI {
  /** true = available, false = taken, null = unknown. */
  checkAvailability(domain: string): Promise<boolean | null>;
  register(domain: string, years: number, nameservers?: string[]): Promise<RegisterResult>;
  renew(domain: string, years: number): Promise<RegisterResult>;
  transfer(domain: string, years: number, authCode: string): Promise<RegisterResult>;
  // Optional DNS management (registrar-hosted zone).
  listDns?(domain: string): Promise<DnsRecord[]>;
  addDns?(domain: string, rec: Omit<DnsRecord, "id">): Promise<RegisterResult>;
  updateDns?(domain: string, id: string, rec: Omit<DnsRecord, "id">): Promise<RegisterResult>;
  deleteDns?(domain: string, id: string): Promise<RegisterResult>;
}
