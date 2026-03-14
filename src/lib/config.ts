import * as path from "path";
import * as os from "os";

export const API_BASE_URL =
  process.env.DATABODY_API_URL || "http://localhost:3000";
export const CLIENT_ID = "databody-mcp";
export const CALLBACK_PORT = parseInt(
  process.env.DATABODY_CALLBACK_PORT || "8787"
);
export const TOKEN_FILE = path.join(os.homedir(), ".databody_token.json");
