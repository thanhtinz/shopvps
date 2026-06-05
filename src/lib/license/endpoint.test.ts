import { describe, it, expect, afterEach } from "vitest";
import { getLicenseEndpoint } from "./endpoint";

const original = process.env.LS_ENDPOINT;
afterEach(() => {
  if (original === undefined) delete process.env.LS_ENDPOINT;
  else process.env.LS_ENDPOINT = original;
});

describe("getLicenseEndpoint", () => {
  it("decodes the baked-in endpoint by default", () => {
    delete process.env.LS_ENDPOINT;
    expect(getLicenseEndpoint()).toMatch(/^https?:\/\//);
  });

  it("honors the undocumented LS_ENDPOINT override", () => {
    process.env.LS_ENDPOINT = "https://license.example.test";
    expect(getLicenseEndpoint()).toBe("https://license.example.test");
  });

  it("ignores a blank override and falls back to the default", () => {
    process.env.LS_ENDPOINT = "   ";
    expect(getLicenseEndpoint()).toMatch(/^https?:\/\//);
  });
});
