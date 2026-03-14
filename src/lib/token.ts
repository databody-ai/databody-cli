import * as fs from "fs";
import { TOKEN_FILE } from "./config.js";

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

export function loadToken(): TokenData | null {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
      if (data.expires_at && Date.now() > data.expires_at) {
        return data.refresh_token ? data : null;
      }
      return data;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export function saveToken(token: TokenData): void {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(token, null, 2), {
    mode: 0o600,
  });
}

export function clearToken(): void {
  try {
    fs.unlinkSync(TOKEN_FILE);
  } catch {
    // Ignore errors
  }
}
