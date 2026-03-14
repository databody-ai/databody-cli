import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

export function registerAiCommands(program: Command) {
  const ai = program.command("ai").description("AI features & coaching");

  ai.command("chat")
    .description("Chat with the AI nutrition coach")
    .argument("<message>", "Your message")
    .option("--thread <id>", "Thread ID for conversation context")
    .option("--household <id>", "Household ID for family context")
    .action(
      withErrorHandler(
        async (
          message: string,
          opts: { thread?: string; household?: string }
        ) => {
          const body: Record<string, unknown> = { message };
          if (opts.thread) body.thread_id = parseInt(opts.thread);
          if (opts.household) body.household_id = parseInt(opts.household);

          const result = await apiCall("/ai/chat", "POST", body);
          output(result, program.opts().pretty);
        }
      )
    );

  ai.command("suggestions")
    .description("Get AI meal suggestions based on remaining macros")
    .option("--preferences <text>", "Meal preferences")
    .option("--household <id>", "Household ID")
    .action(
      withErrorHandler(
        async (opts: { preferences?: string; household?: string }) => {
          const params = new URLSearchParams();
          if (opts.preferences) params.set("preferences", opts.preferences);
          if (opts.household) params.set("household_id", opts.household);
          const qs = params.toString();
          const result = await apiCall(
            `/ai/suggestions${qs ? `?${qs}` : ""}`
          );
          output(result, program.opts().pretty);
        }
      )
    );

  ai.command("analyze-photo")
    .description("Analyze a meal photo for nutrition estimation")
    .option("--file <path>", "Path to image file")
    .option("--base64 <data>", "Base64-encoded image data")
    .option("--mime <type>", "MIME type (default: auto-detect from file)")
    .action(
      withErrorHandler(
        async (opts: { file?: string; base64?: string; mime?: string }) => {
          let imageData: string;
          let mimeType: string;

          if (opts.file) {
            const filePath = path.resolve(opts.file);
            const buffer = fs.readFileSync(filePath);
            imageData = buffer.toString("base64");
            mimeType =
              opts.mime || detectMimeType(filePath) || "image/jpeg";

            const sizeMB = buffer.length / (1024 * 1024);
            if (sizeMB > 20) {
              output(
                { error: `File too large (${sizeMB.toFixed(1)}MB). Max 20MB.` },
                program.opts().pretty
              );
              process.exit(1);
            }
          } else if (opts.base64) {
            imageData = opts.base64;
            mimeType = opts.mime || "image/jpeg";
          } else {
            output(
              { error: "Provide --file or --base64" },
              program.opts().pretty
            );
            process.exit(1);
            return;
          }

          const result = await apiCall("/ai/analyze_photo", "POST", {
            image: imageData,
            mime_type: mimeType,
          });
          output(result, program.opts().pretty);
        }
      )
    );

  ai.command("parse")
    .description("Parse a food description into structured nutrition data")
    .argument("<description>", "Food description text")
    .action(
      withErrorHandler(async (description: string) => {
        const result = await apiCall("/ai/parse_description", "POST", {
          description,
        });
        output(result, program.opts().pretty);
      })
    );

  ai.command("expand")
    .description("Expand a meal into individual ingredients with macros")
    .requiredOption("--meal <name>", "Meal name")
    .requiredOption("--ingredients <list>", "Comma-separated ingredients")
    .option("--calories <n>", "Total calories")
    .option("--protein <n>", "Total protein")
    .option("--carbs <n>", "Total carbs")
    .option("--fat <n>", "Total fat")
    .action(
      withErrorHandler(
        async (opts: {
          meal: string;
          ingredients: string;
          calories?: string;
          protein?: string;
          carbs?: string;
          fat?: string;
        }) => {
          const body: Record<string, unknown> = {
            meal_name: opts.meal,
            ingredients: opts.ingredients,
          };

          if (opts.calories || opts.protein || opts.carbs || opts.fat) {
            body.total_macros = {
              calories: opts.calories ? parseFloat(opts.calories) : undefined,
              protein: opts.protein ? parseFloat(opts.protein) : undefined,
              carbs: opts.carbs ? parseFloat(opts.carbs) : undefined,
              fat: opts.fat ? parseFloat(opts.fat) : undefined,
            };
          }

          const result = await apiCall(
            "/ai/expand_meal_ingredients",
            "POST",
            body
          );
          output(result, program.opts().pretty);
        }
      )
    );

  ai.command("greeting")
    .description("Get a personalized daily greeting")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/ai/daily_greeting");
        output(result, program.opts().pretty);
      })
    );

  ai.command("token-usage")
    .description("Get AI token usage statistics")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/ai/token_usage");
        output(result, program.opts().pretty);
      })
    );

  ai.command("chat-history")
    .description("Get chat message history")
    .option("--thread <id>", "Thread ID")
    .action(
      withErrorHandler(async (opts: { thread?: string }) => {
        const params = new URLSearchParams();
        if (opts.thread) params.set("thread_id", opts.thread);
        const qs = params.toString();
        const result = await apiCall(
          `/ai/chat_history${qs ? `?${qs}` : ""}`
        );
        output(result, program.opts().pretty);
      })
    );
}

function detectMimeType(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
  };
  return mimeTypes[ext] || null;
}
