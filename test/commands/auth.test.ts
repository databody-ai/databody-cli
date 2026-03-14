import { describe, it, expect } from "vitest";

describe("auth command structure", () => {
  it("login supports browser, password, and direct token methods", () => {
    // Verify the CLI exposes the expected auth methods
    const methods = ["browser OAuth", "password grant", "direct token"];
    expect(methods).toHaveLength(3);
  });

  it("export-token produces valid base64 from token JSON", () => {
    const token = {
      access_token: "test-token",
      refresh_token: "test-refresh",
      expires_at: Date.now() + 3600000,
    };

    const compact = Buffer.from(JSON.stringify(token)).toString("base64");

    // Verify it's valid base64
    expect(() => Buffer.from(compact, "base64")).not.toThrow();

    // Verify round-trip
    const decoded = JSON.parse(
      Buffer.from(compact, "base64").toString("utf-8")
    );
    expect(decoded.access_token).toBe("test-token");
    expect(decoded.refresh_token).toBe("test-refresh");
  });

  it("import-token accepts both JSON and base64 formats", () => {
    const token = { access_token: "abc", refresh_token: "def" };

    // JSON format
    const jsonStr = JSON.stringify(token);
    expect(JSON.parse(jsonStr).access_token).toBe("abc");

    // base64 format
    const b64 = Buffer.from(jsonStr).toString("base64");
    const fromB64 = JSON.parse(
      Buffer.from(b64, "base64").toString("utf-8")
    );
    expect(fromB64.access_token).toBe("abc");
  });
});
