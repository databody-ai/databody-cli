import { Command } from "commander";
import * as fs from "fs";
import { loadToken, saveToken, clearToken, type TokenData } from "../lib/token.js";
import {
  startOAuthFlow,
  authenticateWithPassword,
} from "../lib/auth.js";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";
import { TOKEN_FILE } from "../lib/config.js";

export function registerAuthCommands(program: Command) {
  const auth = program.command("auth").description("Authentication");

  auth
    .command("login")
    .description("Authenticate with DataBody")
    .option("--password", "Use email/password instead of browser OAuth")
    .option("-e, --email <email>", "Email address (for password login)")
    .option("-p, --pass <password>", "Password (for password login)")
    .option(
      "--token <access_token>",
      "Directly set an access token (for cross-machine auth)"
    )
    .option(
      "--refresh-token <refresh_token>",
      "Refresh token (used with --token)"
    )
    .action(
      withErrorHandler(async (opts: {
        password?: boolean;
        email?: string;
        pass?: string;
        token?: string;
        refreshToken?: string;
      }) => {
        const pretty = program.opts().pretty;

        if (opts.token) {
          // Direct token import
          const token: TokenData = {
            access_token: opts.token,
            refresh_token: opts.refreshToken,
          };
          saveToken(token);

          // Verify the token works
          try {
            const user = await apiCall("/users/me");
            output(
              { authenticated: true, message: "Token saved and verified", user },
              pretty
            );
          } catch {
            clearToken();
            output(
              { authenticated: false, error: "Token is invalid or expired" },
              pretty
            );
            process.exit(1);
          }
          return;
        }

        if (opts.password) {
          if (!opts.email || !opts.pass) {
            output(
              {
                error:
                  "Email and password required. Use: databody auth login --password -e EMAIL -p PASS",
              },
              pretty
            );
            process.exit(1);
          }
          await authenticateWithPassword(opts.email, opts.pass);
          const user = await apiCall("/users/me");
          output({ authenticated: true, message: "Logged in", user }, pretty);
          return;
        }

        // Browser OAuth flow
        await startOAuthFlow();
        const user = await apiCall("/users/me");
        output({ authenticated: true, message: "Logged in", user }, pretty);
      })
    );

  auth
    .command("logout")
    .description("Clear stored authentication")
    .action(
      withErrorHandler(async () => {
        clearToken();
        output(
          { authenticated: false, message: "Logged out" },
          program.opts().pretty
        );
      })
    );

  auth
    .command("status")
    .description("Check authentication status")
    .action(
      withErrorHandler(async () => {
        const pretty = program.opts().pretty;
        const token = loadToken();
        if (!token) {
          output({ authenticated: false }, pretty);
          return;
        }

        try {
          const user = await apiCall("/users/me");
          output({ authenticated: true, user }, pretty);
        } catch {
          output({ authenticated: false, expired: true }, pretty);
        }
      })
    );

  auth
    .command("export-token")
    .description("Export auth token for use on another machine")
    .option("--compact", "Output as a single base64 string")
    .action(
      withErrorHandler(async (opts: { compact?: boolean }) => {
        const pretty = program.opts().pretty;
        const token = loadToken();
        if (!token) {
          output({ error: "Not authenticated" }, pretty);
          process.exit(2);
        }

        if (opts.compact) {
          const encoded = Buffer.from(JSON.stringify(token)).toString(
            "base64"
          );
          // Raw string to stdout for easy copy-paste
          console.log(encoded);
        } else {
          output(token, pretty);
        }
      })
    );

  auth
    .command("import-token")
    .description("Import auth token from another machine")
    .argument("[token_data]", "Base64-encoded or JSON token data")
    .option("--stdin", "Read token data from stdin")
    .action(
      withErrorHandler(async (tokenData: string | undefined, opts: { stdin?: boolean }) => {
        const pretty = program.opts().pretty;
        let raw: string;

        if (opts.stdin) {
          raw = await readStdin();
        } else if (tokenData) {
          raw = tokenData;
        } else {
          output(
            {
              error:
                "Provide token data as argument or use --stdin. Export with: databody auth export-token --compact",
            },
            pretty
          );
          process.exit(1);
          return;
        }

        // Try to parse as JSON first, then as base64
        let token: TokenData;
        try {
          token = JSON.parse(raw);
        } catch {
          try {
            token = JSON.parse(Buffer.from(raw.trim(), "base64").toString("utf-8"));
          } catch {
            output({ error: "Invalid token data. Expected JSON or base64-encoded JSON." }, pretty);
            process.exit(1);
            return;
          }
        }

        if (!token.access_token) {
          output({ error: "Token data missing access_token field" }, pretty);
          process.exit(1);
          return;
        }

        saveToken(token);

        // Verify the token works
        try {
          const user = await apiCall("/users/me");
          output(
            { authenticated: true, message: "Token imported and verified", user },
            pretty
          );
        } catch {
          clearToken();
          output(
            { authenticated: false, error: "Imported token is invalid or expired" },
            pretty
          );
          process.exit(1);
        }
      })
    );
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.resume();
  });
}
