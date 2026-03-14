import { AuthError } from "./api.js";

export function output(data: unknown, pretty?: boolean): void {
  const json = pretty
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);
  console.log(json);
}

export function errorOutput(message: string): void {
  console.error(JSON.stringify({ error: message }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandler<T extends (...args: any[]) => Promise<void>>(fn: T): T {
  return (async (...args: unknown[]) => {
    try {
      await fn(...args);
    } catch (err) {
      errorOutput(err instanceof Error ? err.message : String(err));
      process.exit(err instanceof AuthError ? 2 : 1);
    }
  }) as T;
}
