import * as http from "http";
import * as crypto from "crypto";
import { API_BASE_URL, CLIENT_ID, CALLBACK_PORT } from "./config.js";
import { saveToken, type TokenData } from "./token.js";

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    const token: TokenData = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : undefined,
    };

    saveToken(token);
    return token;
  } catch {
    return null;
  }
}

export async function startOAuthFlow(): Promise<TokenData> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString("hex");

  return new Promise((resolve, reject) => {
    const openSockets = new Set<import("net").Socket>();
    const server = http.createServer(async (req, res) => {
      const url = new URL(
        req.url || "",
        `http://localhost:${CALLBACK_PORT}`
      );

      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(
            `<html><body><h1>Authorization Failed</h1><p>${error}</p></body></html>`
          );
          forceCloseServer();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (returnedState !== state) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<html><body><h1>Invalid State</h1></body></html>");
          forceCloseServer();
          reject(new Error("Invalid OAuth state"));
          return;
        }

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(
            "<html><body><h1>No Code Received</h1></body></html>"
          );
          forceCloseServer();
          reject(new Error("No authorization code received"));
          return;
        }

        try {
          const tokenResponse = await fetch(
            `${API_BASE_URL}/oauth/token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: `http://localhost:${CALLBACK_PORT}/callback`,
                client_id: CLIENT_ID,
                code_verifier: codeVerifier,
              }),
            }
          );

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            throw new Error(`Token exchange failed: ${errorText}`);
          }

          const tokenData = (await tokenResponse.json()) as {
            access_token: string;
            refresh_token?: string;
            expires_in?: number;
          };

          const token: TokenData = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: tokenData.expires_in
              ? Date.now() + tokenData.expires_in * 1000
              : undefined,
          };

          saveToken(token);

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: system-ui; text-align: center; padding: 50px;">
                <h1>Authentication Successful!</h1>
                <p>You can close this window and return to your terminal.</p>
              </body>
            </html>
          `);

          forceCloseServer();
          resolve(token);
        } catch (err) {
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end(
            `<html><body><h1>Token Exchange Failed</h1><p>${err}</p></body></html>`
          );
          forceCloseServer();
          reject(err);
        }
      } else {
        res.writeHead(404);
        res.end("Not Found");
      }
    });

    server.on("connection", (socket) => {
      openSockets.add(socket);
      socket.on("close", () => openSockets.delete(socket));
    });

    function forceCloseServer() {
      server.close();
      for (const socket of openSockets) {
        socket.destroy();
      }
    }

    server.listen(CALLBACK_PORT, () => {
      const authUrl = new URL(`${API_BASE_URL}/oauth/authorize`);
      authUrl.searchParams.set("client_id", CLIENT_ID);
      authUrl.searchParams.set(
        "redirect_uri",
        `http://localhost:${CALLBACK_PORT}/callback`
      );
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "read write");
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");

      const url = authUrl.toString();
      console.error(`\nOpen this URL in your browser to authenticate:\n${url}\n`);
      console.error("Waiting for authentication...");

      // Try to auto-open the browser
      import("child_process").then(({ exec }) => {
        const cmd =
          process.platform === "darwin"
            ? "open"
            : process.platform === "win32"
              ? "start"
              : "xdg-open";
        exec(`${cmd} "${url}"`);
      });
    });

    server.on("error", (err) => {
      reject(new Error(`Failed to start callback server: ${err.message}`));
    });

    setTimeout(() => {
      forceCloseServer();
      reject(new Error("Authentication timeout - please try again"));
    }, 5 * 60 * 1000);
  });
}

export async function authenticateWithPassword(
  email: string,
  password: string
): Promise<TokenData> {
  const response = await fetch(`${API_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      username: email,
      password: password,
      client_id: CLIENT_ID,
      scope: "read write",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Authentication failed: ${error}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const token: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_in
      ? Date.now() + data.expires_in * 1000
      : undefined,
  };

  saveToken(token);
  return token;
}
