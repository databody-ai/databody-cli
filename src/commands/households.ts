import { Command } from "commander";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

export function registerHouseholdsCommands(program: Command) {
  const households = program
    .command("households")
    .description("Household management");

  households
    .command("list")
    .description("List households")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/households");
        output(result, program.opts().pretty);
      })
    );

  households
    .command("summary")
    .description("Get household details with member health data")
    .argument("<id>", "Household ID")
    .option("--days <n>", "Days of nutrition history (1-30)", "1")
    .action(
      withErrorHandler(async (id: string, opts: { days: string }) => {
        const result = await apiCall(
          `/households/${id}?include_health=true&days=${opts.days}`
        );
        output(result, program.opts().pretty);
      })
    );

  households
    .command("create")
    .description("Create a household")
    .argument("<name>", "Household name")
    .action(
      withErrorHandler(async (name: string) => {
        const result = await apiCall("/households", "POST", { name });
        output(result, program.opts().pretty);
      })
    );

  households
    .command("update")
    .description("Update a household")
    .argument("<id>", "Household ID")
    .requiredOption("--name <name>", "New name")
    .action(
      withErrorHandler(async (id: string, opts: { name: string }) => {
        const result = await apiCall(`/households/${id}`, "PATCH", {
          name: opts.name,
        });
        output(result, program.opts().pretty);
      })
    );

  households
    .command("delete")
    .description("Delete a household (owner only)")
    .argument("<id>", "Household ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/households/${id}`, "DELETE");
        output(result, program.opts().pretty);
      })
    );

  households
    .command("leave")
    .description("Leave a household")
    .argument("<id>", "Household ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/households/${id}/leave`, "DELETE");
        output(result, program.opts().pretty);
      })
    );

  households
    .command("members")
    .description("List household members")
    .argument("<id>", "Household ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/households/${id}/members`);
        output(result, program.opts().pretty);
      })
    );

  households
    .command("remove-member")
    .description("Remove a member from household (owner only)")
    .argument("<id>", "Household ID")
    .argument("<member_id>", "Member ID")
    .action(
      withErrorHandler(async (id: string, memberId: string) => {
        const result = await apiCall(
          `/households/${id}/members/${memberId}`,
          "DELETE"
        );
        output(result, program.opts().pretty);
      })
    );
}
