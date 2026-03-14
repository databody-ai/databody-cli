import { Command } from "commander";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

export function registerNutritionCommands(program: Command) {
  const nutrition = program
    .command("nutrition")
    .description("Nutrition logging");

  nutrition
    .command("today")
    .description("Today's nutrition logs with totals and remaining macros")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/nutrition/today");
        output(result, program.opts().pretty);
      })
    );

  nutrition
    .command("history")
    .description("Nutrition history for date range")
    .option("--start <date>", "Start date (YYYY-MM-DD)")
    .option("--end <date>", "End date (YYYY-MM-DD)")
    .action(
      withErrorHandler(async (opts: { start?: string; end?: string }) => {
        const params = new URLSearchParams();
        if (opts.start) params.set("start_date", opts.start);
        if (opts.end) params.set("end_date", opts.end);
        const qs = params.toString();
        const result = await apiCall(`/nutrition/history${qs ? `?${qs}` : ""}`);
        output(result, program.opts().pretty);
      })
    );

  nutrition
    .command("get")
    .description("Get a specific nutrition log")
    .argument("<log_id>", "Nutrition log ID")
    .action(
      withErrorHandler(async (logId: string) => {
        const result = await apiCall(`/nutrition/${logId}`);
        output(result, program.opts().pretty);
      })
    );

  nutrition
    .command("log")
    .description("Log food items")
    .requiredOption(
      "--meal <type>",
      "Meal type (breakfast/lunch/dinner/snack)"
    )
    .option("--items <json>", "JSON array of food items")
    .option("--logged-at <iso>", "Timestamp (ISO format)")
    .option("--notes <text>", "Notes")
    .option("--stdin", "Read items JSON from stdin")
    .action(
      withErrorHandler(
        async (opts: {
          meal: string;
          items?: string;
          loggedAt?: string;
          notes?: string;
          stdin?: boolean;
        }) => {
          let items: unknown[];
          if (opts.stdin) {
            const raw = await readStdin();
            items = JSON.parse(raw);
          } else if (opts.items) {
            items = JSON.parse(opts.items);
          } else {
            output(
              { error: "Provide --items JSON or use --stdin" },
              program.opts().pretty
            );
            process.exit(1);
            return;
          }

          const body: Record<string, unknown> = {
            meal_type: opts.meal,
            nutrition_items_attributes: items,
          };
          if (opts.loggedAt) body.logged_at = opts.loggedAt;
          if (opts.notes) body.notes = opts.notes;

          const result = await apiCall("/nutrition", "POST", body);
          output(result, program.opts().pretty);
        }
      )
    );

  nutrition
    .command("update")
    .description("Update a nutrition log")
    .argument("<log_id>", "Nutrition log ID")
    .option("--meal <type>", "Meal type")
    .option("--logged-at <iso>", "Timestamp")
    .option("--notes <text>", "Notes")
    .action(
      withErrorHandler(
        async (
          logId: string,
          opts: { meal?: string; loggedAt?: string; notes?: string }
        ) => {
          const body: Record<string, string> = {};
          if (opts.meal) body.meal_type = opts.meal;
          if (opts.loggedAt) body.logged_at = opts.loggedAt;
          if (opts.notes) body.notes = opts.notes;

          const result = await apiCall(`/nutrition/${logId}`, "PATCH", body);
          output(result, program.opts().pretty);
        }
      )
    );

  nutrition
    .command("delete")
    .description("Delete a nutrition log")
    .argument("<log_id>", "Nutrition log ID")
    .action(
      withErrorHandler(async (logId: string) => {
        const result = await apiCall(`/nutrition/${logId}`, "DELETE");
        output(result, program.opts().pretty);
      })
    );

  nutrition
    .command("add-item")
    .description("Add a food item to an existing log")
    .argument("<log_id>", "Nutrition log ID")
    .requiredOption("--name <name>", "Food name")
    .option("--brand <brand>", "Brand")
    .option("--serving-size <size>", "Serving size (e.g. 150g)")
    .option("--serving-quantity <qty>", "Serving quantity")
    .option("--calories <n>", "Calories")
    .option("--protein <n>", "Protein grams")
    .option("--carbs <n>", "Carbs grams")
    .option("--fat <n>", "Fat grams")
    .option("--fiber <n>", "Fiber grams")
    .action(
      withErrorHandler(
        async (
          logId: string,
          opts: {
            name: string;
            brand?: string;
            servingSize?: string;
            servingQuantity?: string;
            calories?: string;
            protein?: string;
            carbs?: string;
            fat?: string;
            fiber?: string;
          }
        ) => {
          const body: Record<string, string | number> = { name: opts.name };
          if (opts.brand) body.brand = opts.brand;
          if (opts.servingSize) body.serving_size = opts.servingSize;
          if (opts.servingQuantity)
            body.serving_quantity = parseFloat(opts.servingQuantity);
          if (opts.calories) body.calories = parseFloat(opts.calories);
          if (opts.protein) body.protein_grams = parseFloat(opts.protein);
          if (opts.carbs) body.carbs_grams = parseFloat(opts.carbs);
          if (opts.fat) body.fat_grams = parseFloat(opts.fat);
          if (opts.fiber) body.fiber_grams = parseFloat(opts.fiber);

          const result = await apiCall(
            `/nutrition/${logId}/items`,
            "POST",
            body
          );
          output(result, program.opts().pretty);
        }
      )
    );

  nutrition
    .command("delete-item")
    .description("Delete a food item from a log")
    .argument("<log_id>", "Nutrition log ID")
    .argument("<item_id>", "Nutrition item ID")
    .action(
      withErrorHandler(async (logId: string, itemId: string) => {
        const result = await apiCall(
          `/nutrition/${logId}/items/${itemId}`,
          "DELETE"
        );
        output(result, program.opts().pretty);
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
