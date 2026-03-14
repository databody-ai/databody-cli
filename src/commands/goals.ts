import { Command } from "commander";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

export function registerGoalsCommands(program: Command) {
  const goals = program.command("goals").description("Fitness goals");

  goals
    .command("current")
    .description("Get active goal with macro targets")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/goals/current");
        output(result, program.opts().pretty);
      })
    );

  goals
    .command("list")
    .description("List all goals")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/goals");
        output(result, program.opts().pretty);
      })
    );

  goals
    .command("get")
    .description("Get a specific goal")
    .argument("<id>", "Goal ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/goals/${id}`);
        output(result, program.opts().pretty);
      })
    );

  goals
    .command("create")
    .description("Create a new goal")
    .option("--calories <n>", "Daily calorie target")
    .option("--protein <n>", "Daily protein grams")
    .option("--carbs <n>", "Daily carbs grams")
    .option("--fat <n>", "Daily fat grams")
    .option("--strategy <s>", "Strategy (cut/maintain/bulk)")
    .option("--target-bf <n>", "Target body fat percentage")
    .option("--target-date <date>", "Target date (YYYY-MM-DD)")
    .option("--active", "Set as active goal")
    .action(
      withErrorHandler(async (opts: Record<string, string | boolean | undefined>) => {
        const body: Record<string, unknown> = {};
        if (opts.calories) body.daily_calorie_target = parseFloat(opts.calories as string);
        if (opts.protein) body.daily_protein_grams = parseFloat(opts.protein as string);
        if (opts.carbs) body.daily_carbs_grams = parseFloat(opts.carbs as string);
        if (opts.fat) body.daily_fat_grams = parseFloat(opts.fat as string);
        if (opts.strategy) body.strategy = opts.strategy;
        if (opts.targetBf)
          body.target_body_fat_percentage = parseFloat(opts.targetBf as string);
        if (opts.targetDate) body.target_date = opts.targetDate;
        if (opts.active) body.active = true;

        const result = await apiCall("/goals", "POST", body);
        output(result, program.opts().pretty);
      })
    );

  goals
    .command("update")
    .description("Update a goal")
    .argument("<id>", "Goal ID")
    .option("--calories <n>", "Daily calorie target")
    .option("--protein <n>", "Daily protein grams")
    .option("--carbs <n>", "Daily carbs grams")
    .option("--fat <n>", "Daily fat grams")
    .option("--strategy <s>", "Strategy (cut/maintain/bulk)")
    .option("--target-bf <n>", "Target body fat percentage")
    .option("--target-date <date>", "Target date (YYYY-MM-DD)")
    .option("--active <bool>", "Active status (true/false)")
    .option("--protein-per-lb <n>", "Protein per lb lean body mass")
    .option("--fat-per-lb <n>", "Fat per lb body weight")
    .option("--weekly-loss <n>", "Weekly weight loss percentage")
    .option("--flex-weekends", "Enable flexible weekends")
    .option("--no-flex-weekends", "Disable flexible weekends")
    .option("--flex-weekends-pct <n>", "Flexible weekends percentage")
    .action(
      withErrorHandler(async (id: string, opts: Record<string, string | boolean | undefined>) => {
        const body: Record<string, unknown> = {};
        if (opts.calories) body.daily_calorie_target = parseFloat(opts.calories as string);
        if (opts.protein) body.daily_protein_grams = parseFloat(opts.protein as string);
        if (opts.carbs) body.daily_carbs_grams = parseFloat(opts.carbs as string);
        if (opts.fat) body.daily_fat_grams = parseFloat(opts.fat as string);
        if (opts.strategy) body.strategy = opts.strategy;
        if (opts.targetBf)
          body.target_body_fat_percentage = parseFloat(opts.targetBf as string);
        if (opts.targetDate) body.target_date = opts.targetDate;
        if (opts.active !== undefined) body.active = opts.active === "true";
        if (opts.proteinPerLb)
          body.protein_per_lb_lbm = parseFloat(opts.proteinPerLb as string);
        if (opts.fatPerLb) body.fat_per_lb = parseFloat(opts.fatPerLb as string);
        if (opts.weeklyLoss)
          body.weekly_weight_loss_percentage = parseFloat(opts.weeklyLoss as string);
        if (opts.flexWeekends === true) body.flexible_weekends_enabled = true;
        if (opts.flexWeekends === false) body.flexible_weekends_enabled = false;
        if (opts.flexWeekendsPct)
          body.flexible_weekends_percentage = parseFloat(
            opts.flexWeekendsPct as string
          );

        const result = await apiCall(`/goals/${id}`, "PATCH", body);
        output(result, program.opts().pretty);
      })
    );

  goals
    .command("delete")
    .description("Delete a goal")
    .argument("<id>", "Goal ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/goals/${id}`, "DELETE");
        output(result, program.opts().pretty);
      })
    );

  goals
    .command("calculate")
    .description("Recalculate macros based on current health data")
    .argument("<id>", "Goal ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/goals/${id}/calculate`, "POST");
        output(result, program.opts().pretty);
      })
    );
}
