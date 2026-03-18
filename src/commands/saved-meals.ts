import { Command } from "commander";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

export function registerSavedMealsCommands(program: Command) {
  const savedMeals = program
    .command("saved-meals")
    .description("Saved meals management");

  savedMeals
    .command("list")
    .description("List all saved meals")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/saved_meals");
        output(result, program.opts().pretty);
      })
    );

  savedMeals
    .command("create")
    .description("Create a saved meal")
    .requiredOption("--name <name>", "Meal name")
    .option(
      "--meal-type <type>",
      "Meal type (breakfast/lunch/dinner/snack)"
    )
    .option("--items <json>", "JSON array of meal items")
    .action(
      withErrorHandler(async (opts: Record<string, string | undefined>) => {
        const body: Record<string, unknown> = { name: opts.name! };
        if (opts.mealType) body.meal_type = opts.mealType;
        if (opts.items) body.saved_meal_items_attributes = JSON.parse(opts.items);

        const result = await apiCall("/saved_meals", "POST", body);
        output(result, program.opts().pretty);
      })
    );

  savedMeals
    .command("update")
    .description("Update a saved meal")
    .argument("<id>", "Saved meal ID")
    .option("--name <name>", "Meal name")
    .option(
      "--meal-type <type>",
      "Meal type (breakfast/lunch/dinner/snack)"
    )
    .option("--items <json>", "JSON array of meal items (replaces existing)")
    .action(
      withErrorHandler(
        async (id: string, opts: Record<string, string | undefined>) => {
          const body: Record<string, unknown> = {};
          if (opts.name) body.name = opts.name;
          if (opts.mealType) body.meal_type = opts.mealType;
          if (opts.items)
            body.saved_meal_items_attributes = JSON.parse(opts.items);

          const result = await apiCall(`/saved_meals/${id}`, "PATCH", body);
          output(result, program.opts().pretty);
        }
      )
    );

  savedMeals
    .command("delete")
    .description("Delete a saved meal")
    .argument("<id>", "Saved meal ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/saved_meals/${id}`, "DELETE");
        output(result, program.opts().pretty);
      })
    );
}
