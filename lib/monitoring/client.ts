"use client";

import Rollbar from "rollbar";
import { monitoringEnvironment, rollbarClientToken, SCRUB_FIELDS } from "./shared";

let instance: Rollbar | null | undefined;

/** Browser Rollbar client (uncaught errors and promise rejections), or null until the client token is set. */
export function clientRollbar() {
  if (instance !== undefined) return instance;
  const accessToken = rollbarClientToken();
  instance = accessToken && typeof window !== "undefined" ? new Rollbar({
    accessToken,
    environment: monitoringEnvironment,
    captureUncaught: true,
    captureUnhandledRejections: true,
    scrubFields: SCRUB_FIELDS,
    // Browser extensions and old cached tabs produce noise that is not ours to fix.
    ignoredMessages: ["ResizeObserver loop", "Script error.", "Load failed", "Failed to fetch", "NetworkError"],
    payload: { client: { javascript: { code_version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA, source_map_enabled: true } } },
  }) : null;
  return instance;
}

export function reportClientError(error: unknown, context: Record<string, unknown> = {}) {
  clientRollbar()?.error(error instanceof Error ? error : new Error(String(error)), context);
}
