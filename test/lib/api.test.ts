import { describe, it, expect } from "vitest";
import { AuthError } from "../../src/lib/api.js";

describe("AuthError", () => {
  it("has correct name", () => {
    const err = new AuthError("test message");
    expect(err.name).toBe("AuthError");
    expect(err.message).toBe("test message");
  });

  it("is instanceof Error", () => {
    const err = new AuthError("test");
    expect(err instanceof Error).toBe(true);
    expect(err instanceof AuthError).toBe(true);
  });
});

describe("token export/import format", () => {
  it("round-trips through base64 encoding", () => {
    const token = {
      access_token: "abc123",
      refresh_token: "def456",
      expires_at: 1700000000000,
    };

    const encoded = Buffer.from(JSON.stringify(token)).toString("base64");
    const decoded = JSON.parse(
      Buffer.from(encoded, "base64").toString("utf-8")
    );

    expect(decoded).toEqual(token);
  });

  it("handles tokens without refresh_token", () => {
    const token = { access_token: "abc123" };

    const encoded = Buffer.from(JSON.stringify(token)).toString("base64");
    const decoded = JSON.parse(
      Buffer.from(encoded, "base64").toString("utf-8")
    );

    expect(decoded.access_token).toBe("abc123");
    expect(decoded.refresh_token).toBeUndefined();
  });
});
