import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth.js";
import { registerUserCommands } from "./commands/user.js";
import { registerHealthCommands } from "./commands/health.js";
import { registerNutritionCommands } from "./commands/nutrition.js";
import { registerFoodCommands } from "./commands/food.js";
import { registerGoalsCommands } from "./commands/goals.js";
import { registerWorkoutsCommands } from "./commands/workouts.js";
import { registerAiCommands } from "./commands/ai.js";
import { registerThreadsCommands } from "./commands/threads.js";
import { registerNotesCommands } from "./commands/notes.js";
import { registerHouseholdsCommands } from "./commands/households.js";
import { registerInvitesCommands } from "./commands/invites.js";
import { registerSavedMealsCommands } from "./commands/saved-meals.js";
import { apiCall } from "./lib/api.js";
import { output, withErrorHandler } from "./lib/output.js";

const program = new Command();

program
  .name("databody")
  .description("DataBody CLI - Health & Fitness Tracking")
  .version("1.0.2")
  .option("--pretty", "Pretty-print JSON output");

// Register domain subcommands
registerAuthCommands(program);
registerUserCommands(program);
registerHealthCommands(program);
registerNutritionCommands(program);
registerFoodCommands(program);
registerGoalsCommands(program);
registerWorkoutsCommands(program);
registerAiCommands(program);
registerThreadsCommands(program);
registerNotesCommands(program);
registerHouseholdsCommands(program);
registerInvitesCommands(program);
registerSavedMealsCommands(program);

// Top-level shortcuts
program
  .command("summary")
  .description("Today's health summary (shortcut for: health summary)")
  .action(
    withErrorHandler(async () => {
      const result = await apiCall("/health/summary");
      output(result, program.opts().pretty);
    })
  );

program
  .command("today")
  .description("Today's nutrition (shortcut for: nutrition today)")
  .action(
    withErrorHandler(async () => {
      const result = await apiCall("/nutrition/today");
      output(result, program.opts().pretty);
    })
  );

program
  .command("chat")
  .description("Chat with AI coach (shortcut for: ai chat)")
  .argument("<message>", "Your message")
  .option("--thread <id>", "Thread ID")
  .option("--household <id>", "Household ID")
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

program
  .command("log")
  .description("Log food (shortcut for: nutrition log)")
  .argument("<meal>", "Meal type (breakfast/lunch/dinner/snack)")
  .argument("<items>", "JSON array of food items")
  .action(
    withErrorHandler(async (meal: string, items: string) => {
      const parsed = JSON.parse(items);
      const result = await apiCall("/nutrition", "POST", {
        meal_type: meal,
        nutrition_items_attributes: parsed,
      });
      output(result, program.opts().pretty);
    })
  );

program.parse();
