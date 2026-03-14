import { Command } from "commander";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

export function registerInvitesCommands(program: Command) {
  const invites = program
    .command("invites")
    .description("Household invitations");

  invites
    .command("list")
    .description("List pending invites for a household (owner view)")
    .argument("<household_id>", "Household ID")
    .action(
      withErrorHandler(async (householdId: string) => {
        const result = await apiCall(
          `/households/${householdId}/invites`
        );
        output(result, program.opts().pretty);
      })
    );

  invites
    .command("pending")
    .description("List invites sent to you")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/household_invites");
        output(result, program.opts().pretty);
      })
    );

  invites
    .command("create")
    .description("Invite someone to a household")
    .argument("<household_id>", "Household ID")
    .requiredOption("--email <email>", "Email address to invite")
    .action(
      withErrorHandler(
        async (householdId: string, opts: { email: string }) => {
          const result = await apiCall(
            `/households/${householdId}/invites`,
            "POST",
            { email_address: opts.email }
          );
          output(result, program.opts().pretty);
        }
      )
    );

  invites
    .command("cancel")
    .description("Cancel a pending invite (owner only)")
    .argument("<household_id>", "Household ID")
    .argument("<invite_id>", "Invite ID")
    .action(
      withErrorHandler(async (householdId: string, inviteId: string) => {
        const result = await apiCall(
          `/households/${householdId}/invites/${inviteId}`,
          "DELETE"
        );
        output(result, program.opts().pretty);
      })
    );

  invites
    .command("accept")
    .description("Accept an invite")
    .argument("<id>", "Invite ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(
          `/household_invites/${id}/accept`,
          "POST"
        );
        output(result, program.opts().pretty);
      })
    );

  invites
    .command("decline")
    .description("Decline an invite")
    .argument("<id>", "Invite ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(
          `/household_invites/${id}/reject`,
          "POST"
        );
        output(result, program.opts().pretty);
      })
    );
}
