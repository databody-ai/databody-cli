import { Command } from "commander";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

export function registerUserCommands(program: Command) {
  const user = program.command("user").description("User profile");

  user
    .command("profile")
    .description("Get current user profile")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/users/me");
        output(result, program.opts().pretty);
      })
    );

  user
    .command("update")
    .description("Update profile settings")
    .option("--name <name>", "Display name")
    .option("--height <cm>", "Height in cm")
    .option("--sex <sex>", "Sex (male/female)")
    .option("--birth-date <date>", "Birth date (YYYY-MM-DD)")
    .option(
      "--activity-level <level>",
      "Activity level (sedentary/lightly_active/moderately_active/very_active/extra_active)"
    )
    .option("--timezone <tz>", "Timezone (e.g. America/New_York)")
    .option("--weight-unit <unit>", "Weight unit (lbs/kg)")
    .option("--height-unit <unit>", "Height unit (in/cm)")
    .action(
      withErrorHandler(async (opts: Record<string, string | undefined>) => {
        const body: Record<string, string | number> = {};
        if (opts.name) body.name = opts.name;
        if (opts.height) body.height_cm = parseFloat(opts.height);
        if (opts.sex) body.sex = opts.sex;
        if (opts.birthDate) body.birth_date = opts.birthDate;
        if (opts.activityLevel) body.activity_level = opts.activityLevel;
        if (opts.timezone) body.timezone = opts.timezone;
        if (opts.weightUnit) body.weight_unit = opts.weightUnit;
        if (opts.heightUnit) body.height_unit = opts.heightUnit;

        const result = await apiCall("/users/me", "PATCH", body);
        output(result, program.opts().pretty);
      })
    );

  user
    .command("change-password")
    .description("Change password")
    .requiredOption("--current <password>", "Current password")
    .requiredOption("--new <password>", "New password")
    .action(
      withErrorHandler(
        async (opts: { current: string; new: string }) => {
          const result = await apiCall("/users/me/change_password", "POST", {
            current_password: opts.current,
            new_password: opts.new,
            new_password_confirmation: opts.new,
          });
          output(result, program.opts().pretty);
        }
      )
    );

  user
    .command("change-email")
    .description("Change email address")
    .requiredOption("--password <password>", "Current password")
    .requiredOption("--email <email>", "New email address")
    .action(
      withErrorHandler(
        async (opts: { password: string; email: string }) => {
          const result = await apiCall("/users/me/change_email", "POST", {
            password: opts.password,
            new_email_address: opts.email,
          });
          output(result, program.opts().pretty);
        }
      )
    );
}
