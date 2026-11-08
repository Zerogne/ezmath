import type { Instrumentation } from "next";

/** Every uncaught server error (pages, Server Actions, route handlers) goes to Rollbar when it is configured. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { rollbarServerToken } = await import("@/lib/monitoring/shared");
  if (!rollbarServerToken()) return;
  const { reportServerError } = await import("@/lib/monitoring/server");
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  await reportServerError(error, { path: request.path, method: request.method, routePath: context.routePath, routeType: context.routeType, renderSource: context.renderSource, digest });
};
