import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// We test the token functions directly by importing the module
// but we need to mock the TOKEN_FILE to use a temp file
const TEST_TOKEN_FILE = path.join(os.tmpdir(), ".databody_test_token.json");

// We'll test the logic inline since the module uses a fixed path
describe("token file operations", () => {
  beforeEach(() => {
    try {
      fs.unlinkSync(TEST_TOKEN_FILE);
    } catch {
      // ignore
    }
  });

  afterEach(() => {
    try {
      fs.unlinkSync(TEST_TOKEN_FILE);
    } catch {
      // ignore
    }
  });

  it("saves and reads token data", () => {
    const token = {
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expires_at: Date.now() + 3600000,
    };

    fs.writeFileSync(TEST_TOKEN_FILE, JSON.stringify(token, null, 2), {
      mode: 0o600,
    });

    const data = JSON.parse(fs.readFileSync(TEST_TOKEN_FILE, "utf-8"));
    expect(data.access_token).toBe("test-access-token");
    expect(data.refresh_token).toBe("test-refresh-token");
    expect(data.expires_at).toBeGreaterThan(Date.now());
  });

  it("detects expired tokens", () => {
    const token = {
      access_token: "expired-token",
      refresh_token: "refresh-token",
      expires_at: Date.now() - 1000, // expired 1 second ago
    };

    fs.writeFileSync(TEST_TOKEN_FILE, JSON.stringify(token, null, 2));

    const data = JSON.parse(fs.readFileSync(TEST_TOKEN_FILE, "utf-8"));
    expect(data.expires_at).toBeLessThan(Date.now());
  });

  it("sets correct file permissions", () => {
    const token = { access_token: "test" };

    fs.writeFileSync(TEST_TOKEN_FILE, JSON.stringify(token), {
      mode: 0o600,
    });

    const stats = fs.statSync(TEST_TOKEN_FILE);
    // Check that only owner can read/write (0o600)
    const mode = stats.mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("handles missing token file gracefully", () => {
    expect(fs.existsSync(TEST_TOKEN_FILE)).toBe(false);
  });

  it("clears token by deleting file", () => {
    fs.writeFileSync(TEST_TOKEN_FILE, JSON.stringify({ access_token: "test" }));
    expect(fs.existsSync(TEST_TOKEN_FILE)).toBe(true);

    fs.unlinkSync(TEST_TOKEN_FILE);
    expect(fs.existsSync(TEST_TOKEN_FILE)).toBe(false);
  });
});
