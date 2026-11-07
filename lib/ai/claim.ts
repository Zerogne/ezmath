import "server-only";

/** A pending generation older than this is assumed to have died (function timeout, crash) and may be retried. */
export const STALE_PENDING_MS = 5 * 60 * 1000;

type Row = { status: "pending" | "ready" | "failed"; updated_at: string } | null;

/**
 * Decides whether this request should (re)start a generation.
 * Ready rows are never regenerated; pending rows are left alone unless stale; failed rows are retried.
 */
export function shouldClaim(row: Row, now = Date.now()) {
  if (!row) return true;
  if (row.status === "ready") return false;
  if (row.status === "failed") return true;
  return now - new Date(row.updated_at).getTime() > STALE_PENDING_MS;
}
