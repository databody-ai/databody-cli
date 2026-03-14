import { Command } from "commander";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

export function registerThreadsCommands(program: Command) {
  const threads = program
    .command("threads")
    .description("Chat threads");

  threads
    .command("list")
    .description("List chat threads with previews")
    .action(
      withErrorHandler(async () => {
        const result = await apiCall("/chat_threads");
        output(result, program.opts().pretty);
      })
    );

  threads
    .command("get")
    .description("Get a thread with all messages")
    .argument("<id>", "Thread ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/chat_threads/${id}`);
        output(result, program.opts().pretty);
      })
    );

  threads
    .command("create")
    .description("Create a new chat thread")
    .option("--title <title>", "Thread title")
    .action(
      withErrorHandler(async (opts: { title?: string }) => {
        const body: Record<string, string> = {};
        if (opts.title) body.title = opts.title;
        const result = await apiCall("/chat_threads", "POST", body);
        output(result, program.opts().pretty);
      })
    );

  threads
    .command("delete")
    .description("Delete a chat thread")
    .argument("<id>", "Thread ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(`/chat_threads/${id}`, "DELETE");
        output(result, program.opts().pretty);
      })
    );

  threads
    .command("generate-title")
    .description("AI-generate a title from thread messages")
    .argument("<id>", "Thread ID")
    .action(
      withErrorHandler(async (id: string) => {
        const result = await apiCall(
          `/chat_threads/${id}/generate_title`,
          "POST"
        );
        output(result, program.opts().pretty);
      })
    );
}
