import { createAdminClient } from "@/lib/supabase/admin";
import { verifyBylWebhook } from "@/lib/byl/server";
import { finishBylEvent, parseBylWebhook, processBylEvent, recordBylEvent } from "@/lib/byl/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyBylWebhook(rawBody, request.headers.get("byl-signature"))) return Response.json({ error: "Invalid signature" }, { status: 401 });

  const event = parseBylWebhook(rawBody);
  if (!event) return Response.json({ error: "Invalid payload" }, { status: 400 });
  if (String(event.project_id) !== process.env.BYL_PROJECT_ID) return Response.json({ error: "Invalid project" }, { status: 403 });

  const admin = createAdminClient();
  try {
    const recordState = await recordBylEvent(admin, event);
    if (recordState === "done") return Response.json({ received: true, duplicate: true });
    const result = await processBylEvent(admin, event);
    await finishBylEvent(admin, event.id, result);
    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    try { await finishBylEvent(admin, event.id, "failed", message); } catch { /* BYL will retry the original request. */ }
    console.error("BYL webhook processing failed", { eventId: event.id, eventType: event.type, error: message });
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
