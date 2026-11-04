import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { safeNextPath } from "@/lib/auth/safe-next";
import { findPlacementTest } from "@/lib/data/test-repository";
import { GOAL_COLUMNS, goalFromProfile } from "@/lib/goals";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isVerifyMnConfigured } from "@/lib/verify-mn";

export const metadata: Metadata = { title: "Зорилгоо тодорхойлох", robots: { index: false, follow: false } };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string; edit?: string }> }) {
  const { next, edit } = await searchParams;
  const nextPath = safeNextPath(next) ?? "/dashboard";
  if (!isSupabaseConfigured()) redirect(nextPath);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");
  const { data: profile } = await supabase.from("profiles").select(`role, full_name, phone, ${GOAL_COLUMNS}` as const).eq("id", user.id).maybeSingle();
  if (profile && profile.role !== "student") redirect("/dashboard");
  const editing = edit === "1";
  // No redirect for onboarded students: saving goals mid-wizard refreshes this page, and a redirect here
  // would throw the student out before the phone step. The wizard reads `startAt` only on first render.
  const [eyeshPlacement, satPlacement] = await Promise.all([findPlacementTest("EYESH"), findPlacementTest("SAT")]);
  return <OnboardingWizard
    startAt={profile?.onboarded_at && !editing ? "done" : "exam"}
    name={profile?.full_name?.trim().split(/\s+/)[0] ?? ""}
    initial={goalFromProfile(profile)}
    editing={editing}
    nextPath={editing ? "/dashboard/settings" : nextPath}
    phoneLinked={Boolean(profile?.phone)}
    phoneEnabled={isVerifyMnConfigured()}
    placement={{ EYESH: eyeshPlacement ? { id: eyeshPlacement.id, title: eyeshPlacement.title, questionCount: eyeshPlacement.questionCount, durationMinutes: eyeshPlacement.durationMinutes } : null, SAT: satPlacement ? { id: satPlacement.id, title: satPlacement.title, questionCount: satPlacement.questionCount, durationMinutes: satPlacement.durationMinutes } : null }}
  />;
}
