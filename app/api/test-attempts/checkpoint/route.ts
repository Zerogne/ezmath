import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TestSession } from "@/lib/exam/test-types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { session?: TestSession } | null;
  const session = body?.session;
  if (!session?.testId || session.status !== "in_progress") return NextResponse.json({ error: "invalid_checkpoint" }, { status: 400 });
  if (!session.attemptId || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return NextResponse.json({ persisted: "local" }, { status: 202 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ persisted: "local" }, { status: 202 });
  const { error } = await supabase.from("test_attempts").update({
    session_snapshot: { currentQuestionIndex: session.currentQuestionIndex, answers: session.answers, markedForReview: session.markedForReview, remainingSeconds: session.remainingSeconds },
    session_version: session.version,
    last_saved_at: new Date().toISOString(),
  }).eq("id", session.attemptId).eq("user_id", auth.user.id).lt("session_version", session.version);
  if (error) return NextResponse.json({ error: "checkpoint_failed" }, { status: 503 });
  return NextResponse.json({ persisted: "server" });
}
