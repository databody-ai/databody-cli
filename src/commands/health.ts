import { Command } from "commander";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

export function registerHealthCommands(program: Command) {
  const health = program
    .command("health")
    .description("Health data & summary");

  health
    .command("summary")
    .description(
      "Today's health summary with macros, goals, workouts, and trends"
    )
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/health/summary");
        output(result, program.opts().pretty);
      })
    );

  health
    .command("history")
    .description("Historical health stats with trend analysis")
    .option("--days <n>", "Number of days (1-365, default 30)", "30")
    .action(
      withErrorHandler(async (opts: { days: string }) => {
        const result = await apiCall(`/health/history?days=${opts.days}`);
        output(result, program.opts().pretty);
      })
    );
}
