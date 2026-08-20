import type { TestSession } from "./test-types";

export async function checkpointTestSession(session: TestSession, signal?: AbortSignal) {
  if (!navigator.onLine) throw new Error("offline");
  const response = await fetch("/api/test-attempts/checkpoint", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ session }),
    signal,
    keepalive: true,
  });
  if (!response.ok) throw new Error("checkpoint_failed");
}
