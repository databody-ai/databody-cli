import { API_BASE_URL } from "./config.js";
import { loadToken, clearToken } from "./token.js";
import { refreshAccessToken } from "./auth.js";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

async function getAccessToken(): Promise<string | null> {
  const token = loadToken();
  if (!token) return null;

  if (token.expires_at && Date.now() > token.expires_at) {
    if (token.refresh_token) {
      const refreshed = await refreshAccessToken(token.refresh_token);
      return refreshed?.access_token || null;
    }
    return null;
  }

  return token.access_token;
}

export async function apiCall(
  endpoint: string,
  method: string = "GET",
  body?: object
): Promise<unknown> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new AuthError("Not authenticated. Run 'databody auth login' first.");
  }

  const url = `${API_BASE_URL}/api/v1${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    const token = loadToken();
    if (token?.refresh_token) {
      const refreshed = await refreshAccessToken(token.refresh_token);
      if (refreshed) {
        headers.Authorization = `Bearer ${refreshed.access_token}`;
        const retryResponse = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        if (retryResponse.ok) {
          if (retryResponse.status === 204) return { success: true };
          return retryResponse.json();
        }
      }
    }
    clearToken();
    throw new AuthError(
      "Session expired. Run 'databody auth login' to login again."
    );
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }

  if (response.status === 204) {
    return { success: true };
  }

  return response.json();
}
