import { Command } from "commander";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

export function registerWorkoutsCommands(program: Command) {
  const workouts = program
    .command("workouts")
    .description("Workout tracking");

  workouts
    .command("recent")
    .description("Recent workouts (last 7 days)")
    .option("--limit <n>", "Number of workouts", "10")
    .action(
      withErrorHandler(async (opts: { limit: string }) => {
        const result = await apiCall(`/workouts/recent?limit=${opts.limit}`);
        output(result, program.opts().pretty);
      })
    );

  workouts
    .command("list")
    .description("List workouts with filters")
    .option("--start <date>", "Start date (YYYY-MM-DD)")
    .option("--end <date>", "End date (YYYY-MM-DD)")
    .option("--type <type>", "Workout type")
    .option("--limit <n>", "Maximum results", "50")
    .action(
      withErrorHandler(
        async (opts: {
          start?: string;
          end?: string;
          type?: string;
          limit: string;
        }) => {
          const params = new URLSearchParams({ limit: opts.limit });
          if (opts.start) params.set("start_date", opts.start);
          if (opts.end) params.set("end_date", opts.end);
          if (opts.type) params.set("type", opts.type);
          const result = await apiCall(`/workouts?${params}`);
          output(result, program.opts().pretty);
        }
      )
    );

  workouts
    .command("get")
    .description("Get a specific workout")
    .argument("<id>", "Workout ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/workouts/${id}`);
        output(result, program.opts().pretty);
      })
    );

  workouts
    .command("create")
    .description("Log a new workout")
    .requiredOption("--type <type>", "Workout type (running, cycling, etc.)")
    .requiredOption("--started-at <iso>", "Start time (ISO format)")
    .option("--duration <min>", "Duration in minutes")
    .option("--ended-at <iso>", "End time (ISO format)")
    .option("--calories <n>", "Calories burned")
    .option("--heart-rate <n>", "Average heart rate")
    .option("--distance <m>", "Distance in meters")
    .action(
      withErrorHandler(async (opts: Record<string, string | undefined>) => {
        const body: Record<string, unknown> = {
          workout_type: opts.type,
          started_at: opts.startedAt,
        };
        if (opts.duration)
          body.duration_minutes = parseFloat(opts.duration);
        if (opts.endedAt) body.ended_at = opts.endedAt;
        if (opts.calories)
          body.calories_burned = parseFloat(opts.calories);
        if (opts.heartRate)
          body.average_heart_rate = parseFloat(opts.heartRate);
        if (opts.distance)
          body.distance_meters = parseFloat(opts.distance);

        const result = await apiCall("/workouts", "POST", body);
        output(result, program.opts().pretty);
      })
    );

  workouts
    .command("update")
    .description("Update a workout")
    .argument("<id>", "Workout ID")
    .option("--type <type>", "Workout type")
    .option("--started-at <iso>", "Start time")
    .option("--duration <min>", "Duration in minutes")
    .option("--ended-at <iso>", "End time")
    .option("--calories <n>", "Calories burned")
    .option("--heart-rate <n>", "Average heart rate")
    .option("--distance <m>", "Distance in meters")
    .action(
      withErrorHandler(async (id: string, opts: Record<string, string | undefined>) => {
        const body: Record<string, unknown> = {};
        if (opts.type) body.workout_type = opts.type;
        if (opts.startedAt) body.started_at = opts.startedAt;
        if (opts.duration)
          body.duration_minutes = parseFloat(opts.duration);
        if (opts.endedAt) body.ended_at = opts.endedAt;
        if (opts.calories)
          body.calories_burned = parseFloat(opts.calories);
        if (opts.heartRate)
          body.average_heart_rate = parseFloat(opts.heartRate);
        if (opts.distance)
          body.distance_meters = parseFloat(opts.distance);

        const result = await apiCall(`/workouts/${id}`, "PATCH", body);
        output(result, program.opts().pretty);
      })
    );

  workouts
    .command("delete")
    .description("Delete a workout")
    .argument("<id>", "Workout ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/workouts/${id}`, "DELETE");
        output(result, program.opts().pretty);
      })
    );
}
