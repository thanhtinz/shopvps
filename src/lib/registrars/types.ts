// Domain registrar abstraction (mirrors src/lib/vps-providers).
export interface RegisterResult {
  ok: boolean;
  expiresAt?: Date;
  message?: string;
}

export interface RegistrarAPI {
  /** true = available, false = taken, null = unknown. */
  checkAvailability(domain: string): Promise<boolean | null>;
  register(domain: string, years: number, nameservers?: string[]): Promise<RegisterResult>;
  renew(domain: string, years: number): Promise<RegisterResult>;
  transfer(domain: string, years: number, authCode: string): Promise<RegisterResult>;
}
