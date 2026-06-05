import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "./encrypt";

describe("encrypt/decrypt", () => {
  it("round-trips a value", () => {
    const secret = "S3cr3t-p@ssw0rd!";
    expect(decrypt(encrypt(secret))).toBe(secret);
  });

  it("produces the iv:tag:ciphertext shape", () => {
    const parts = encrypt("hello").split(":");
    expect(parts).toHaveLength(3);
    parts.forEach(p => expect(p).toMatch(/^[0-9a-f]+$/));
  });

  it("uses a fresh IV so the same plaintext encrypts differently", () => {
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("rejects tampered ciphertext (GCM auth tag)", () => {
    const enc = encrypt("important");
    const [iv, tag, data] = enc.split(":");
    const flipped = data.slice(0, -1) + (data.slice(-1) === "0" ? "1" : "0");
    expect(() => decrypt(`${iv}:${tag}:${flipped}`)).toThrow();
  });

  it("handles unicode", () => {
    const v = "Mật khẩu 🇻🇳 cPanel";
    expect(decrypt(encrypt(v))).toBe(v);
  });
});
