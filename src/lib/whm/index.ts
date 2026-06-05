import axios from "axios";
import { decrypt } from "@/lib/encrypt";

export interface WHMClient {
  createAccount(params: CreateAccountParams): Promise<{ username: string; password: string; domain: string }>;
  suspendAccount(username: string, reason?: string): Promise<void>;
  unsuspendAccount(username: string): Promise<void>;
  terminateAccount(username: string): Promise<void>;
  changePassword(username: string, password: string): Promise<void>;
  getAccountInfo(username: string): Promise<AccountInfo>;
  createSSO(username: string): Promise<string>;
  listAccounts(): Promise<AccountInfo[]>;
}

interface CreateAccountParams {
  username: string;
  password: string;
  domain: string;
  plan: string;
  email?: string;
}

interface AccountInfo {
  user: string;
  domain: string;
  plan: string;
  suspended: boolean;
  diskUsed: number;
  diskLimit: number;
}

export class WHMClientImpl implements WHMClient {
  private base: string;
  private headers: Record<string, string>;

  constructor(host: string, port: number, user: string, encryptedToken: string) {
    const token = decrypt(encryptedToken);
    this.base = `https://${host}:${port}/json-api`;
    this.headers = {
      Authorization: `whm ${user}:${token}`,
      "Content-Type": "application/json",
    };
  }

  private async call(endpoint: string, params: Record<string, any> = {}) {
    const { data } = await axios.get(`${this.base}/${endpoint}`, {
      headers: this.headers,
      params: { "api.version": 1, ...params },
      timeout: 15000,
    });
    if (data.metadata?.result === 0) {
      throw new Error(data.metadata?.reason || "WHM API error");
    }
    return data;
  }

  async createAccount(params: CreateAccountParams) {
    await this.call("createacct", {
      username: params.username,
      password: params.password,
      domain: params.domain,
      plan: params.plan,
      contactemail: params.email || "",
    });
    return { username: params.username, password: params.password, domain: params.domain };
  }

  async suspendAccount(username: string, reason = "Suspended by system") {
    await this.call("suspendacct", { user: username, reason });
  }

  async unsuspendAccount(username: string) {
    await this.call("unsuspendacct", { user: username });
  }

  async terminateAccount(username: string) {
    await this.call("removeacct", { username });
  }

  async changePassword(username: string, password: string) {
    await this.call("passwd", { user: username, password });
  }

  async getAccountInfo(username: string): Promise<AccountInfo> {
    const data = await this.call("accountsummary", { user: username });
    const acct = data.acct?.[0];
    return {
      user: acct?.user, domain: acct?.domain, plan: acct?.plan,
      suspended: acct?.suspended === "1",
      diskUsed: parseInt(acct?.diskused || "0"),
      diskLimit: parseInt(acct?.disklimit || "0"),
    };
  }

  async createSSO(username: string): Promise<string> {
    const data = await this.call("create_user_session", {
      user: username, service: "cpaneld",
    });
    return data.data?.url || "";
  }

  async listAccounts(): Promise<AccountInfo[]> {
    const data = await this.call("listaccts");
    return (data.acct || []).map((a: any) => ({
      user: a.user, domain: a.domain, plan: a.plan,
      suspended: a.suspended === "1",
      diskUsed: parseInt(a.diskused || "0"),
      diskLimit: parseInt(a.disklimit || "0"),
    }));
  }
}

export function getWHMClient(server: { whmHost: string; whmPort: number; whmUser: string; whmToken: string }) {
  return new WHMClientImpl(server.whmHost, server.whmPort, server.whmUser, server.whmToken);
}
