import "server-only";

import Rollbar from "rollbar";
import { monitoringEnvironment, rollbarServerToken, SCRUB_FIELDS } from "./shared";

let instance: Rollbar | null | undefined;

/** Server-side Rollbar client, or null until a Rollbar server token is set (local dev, previews without it). */
function rollbar() {
  if (instance !== undefined) return instance;
  const accessToken = rollbarServerToken();
  instance = accessToken ? new Rollbar({ accessToken, environment: monitoringEnvironment, captureUncaught: false, captureUnhandledRejections: false, scrubFields: SCRUB_FIELDS, codeVersion: process.env.VERCEL_GIT_COMMIT_SHA }) : null;
  return instance;
}

/**
 * Reports a handled server error with a little context (route, ids, never answers or tokens) and waits
 * until it is sent, because a serverless function may freeze as soon as the response is returned.
 * Always logs to the console too, so Vercel logs keep working without Rollbar.
 */
export async function reportServerError(error: unknown, context: Record<string, unknown> = {}) {
  console.error(error, context);
  const client = rollbar();
  if (!client) return;
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 2_000);
    client.error(error instanceof Error ? error : new Error(String(error)), context, () => { clearTimeout(timeout); resolve(); });
  });
}
