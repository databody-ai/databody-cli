import { Command } from "commander";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

export function registerFoodCommands(program: Command) {
  const food = program
    .command("food")
    .description("Food search & favorites");

  food
    .command("search")
    .description("Search food databases")
    .argument("<query>", "Search query")
    .option(
      "--source <source>",
      "Database (fatsecret/usda/openfoodfacts/all)",
      "all"
    )
    .option("--page <n>", "Page number", "1")
    .action(
      withErrorHandler(
        async (query: string, opts: { source: string; page: string }) => {
          const params = new URLSearchParams({
            query,
            source: opts.source,
            page: opts.page,
          });
          const result = await apiCall(`/foods/search?${params}`);
          output(result, program.opts().pretty);
        }
      )
    );

  food
    .command("details")
    .description("Get detailed nutrition for a food")
    .argument("<food_id>", "Food ID (e.g. fatsecret_12345)")
    .action(
      withErrorHandler(async (foodId: string) => {
        const result = await apiCall(`/foods/details/${foodId}`);
        output(result, program.opts().pretty);
      })
    );

  food
    .command("barcode")
    .description("Look up food by barcode")
    .argument("<barcode>", "UPC/EAN barcode")
    .action(
      withErrorHandler(async (barcode: string) => {
        const result = await apiCall(`/foods/barcode/${barcode}`);
        output(result, program.opts().pretty);
      })
    );

  food
    .command("favorites")
    .description("List saved food favorites")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/foods/favorites");
        output(result, program.opts().pretty);
      })
    );

  food
    .command("add-favorite")
    .description("Save a food to favorites")
    .requiredOption("--name <name>", "Food name")
    .option("--brand <brand>", "Brand")
    .option("--serving-size <size>", "Serving size")
    .option("--calories <n>", "Calories")
    .option("--protein <n>", "Protein grams")
    .option("--carbs <n>", "Carbs grams")
    .option("--fat <n>", "Fat grams")
    .option("--fiber <n>", "Fiber grams")
    .option("--barcode <code>", "Barcode")
    .action(
      withErrorHandler(async (opts: Record<string, string | undefined>) => {
        const body: Record<string, string | number> = { name: opts.name! };
        if (opts.brand) body.brand = opts.brand;
        if (opts.servingSize) body.serving_size = opts.servingSize;
        if (opts.calories) body.calories = parseFloat(opts.calories);
        if (opts.protein) body.protein_grams = parseFloat(opts.protein);
        if (opts.carbs) body.carbs_grams = parseFloat(opts.carbs);
        if (opts.fat) body.fat_grams = parseFloat(opts.fat);
        if (opts.fiber) body.fiber_grams = parseFloat(opts.fiber);
        if (opts.barcode) body.barcode = opts.barcode;

        const result = await apiCall("/foods/favorites", "POST", body);
        output(result, program.opts().pretty);
      })
    );

  food
    .command("remove-favorite")
    .description("Remove a food from favorites")
    .argument("<id>", "Favorite ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/foods/favorites/${id}`, "DELETE");
        output(result, program.opts().pretty);
      })
    );

  food
    .command("recents")
    .description("Get recently logged foods")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/foods/recents");
        output(result, program.opts().pretty);
      })
    );
}
