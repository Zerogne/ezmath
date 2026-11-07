import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

/** Student-facing AI feedback (mock analyses, weekly plans) runs on Claude Haiku. */
export const AI_MODEL = "claude-haiku-5-5";

let client: Anthropic | null = null;

export function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** One structured-output call; throws when Claude refuses, runs out of tokens or returns unparseable JSON. */
export async function generateStructured<Schema extends z.ZodType>(schema: Schema, system: string, prompt: string): Promise<z.infer<Schema>> {
  client ??= new Anthropic();
  const response = await client.messages.parse({
    model: AI_MODEL,
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: prompt }],
    output_config: { format: zodOutputFormat(schema) },
  });
  if (response.stop_reason === "refusal") throw new Error(`Claude declined (${response.stop_details?.category ?? "unknown"})`);
  if (response.stop_reason === "max_tokens") throw new Error("Claude response hit max_tokens");
  if (!response.parsed_output) throw new Error("Claude response did not match the schema");
  return response.parsed_output;
}

/** Short, non-secret error text for the `error` column. */
export function aiErrorMessage(error: unknown) {
  if (error instanceof Anthropic.APIError) return `Anthropic ${error.status ?? "error"}: ${error.message}`.slice(0, 500);
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}
