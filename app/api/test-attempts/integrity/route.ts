import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const eventTypes = new Set(["page_hidden", "window_blur", "fullscreen_exit"] as const);
type EventType = "page_hidden" | "window_blur" | "fullscreen_exit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { attemptId?: string; eventType?: EventType; occurredAt?: string } | null;
  if (!body?.attemptId || !body.eventType || !eventTypes.has(body.eventType)) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }
  const occurredAt = new Date(body.occurredAt ?? "");
  if (!Number.isFinite(occurredAt.getTime()) || Math.abs(Date.now() - occurredAt.getTime()) > 5 * 60_000) {
    return NextResponse.json({ error: "invalid_timestamp" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: attempt } = await admin.from("test_attempts").select("id").eq("id", body.attemptId).eq("user_id", user.id).eq("status", "in_progress").maybeSingle();
  if (!attempt) return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  const { error } = await admin.from("test_integrity_events").insert({ attempt_id: attempt.id, user_id: user.id, event_type: body.eventType, occurred_at: occurredAt.toISOString() });
  if (error) return NextResponse.json({ error: "event_not_saved" }, { status: 503 });
  return NextResponse.json({ saved: true });
}
