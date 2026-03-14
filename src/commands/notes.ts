import { Command } from "commander";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

export function registerNotesCommands(program: Command) {
  const notes = program
    .command("notes")
    .description("Personal notes for AI context");

  notes
    .command("list")
    .description("List all notes")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/notes");
        output(result, program.opts().pretty);
      })
    );

  notes
    .command("create")
    .description("Create a note")
    .argument("<content>", "Note content")
    .action(
      withErrorHandler(async (content: string) => {
        const result = await apiCall("/notes", "POST", {
          content,
          created_via: "cli",
        });
        output(result, program.opts().pretty);
      })
    );

  notes
    .command("update")
    .description("Update a note")
    .argument("<id>", "Note ID")
    .argument("<content>", "New content")
    .action(
      withErrorHandler(async (id: string, content: string) => {
        const result = await apiCall(`/notes/${id}`, "PATCH", { content });
        output(result, program.opts().pretty);
      })
    );

  notes
    .command("delete")
    .description("Delete a note")
    .argument("<id>", "Note ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/notes/${id}`, "DELETE");
        output(result, program.opts().pretty);
      })
    );
}
