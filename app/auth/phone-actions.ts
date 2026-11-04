"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, rateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { createVerifyMnSession, getVerifyMnStatus, isVerifyMnConfigured, normalizeMongolianPhone, VerifyMnError } from "@/lib/verify-mn";

export type PhoneChallenge = { id: string; phone: string; code: string; shortcode: string; smsUri: string; expiresAt: string };
export type StartResult = { challenge?: PhoneChallenge; error?: string };
export type CheckResult = { status: "pending" | "verified" | "expired"; error?: string };

const RESET_WINDOW_MS = 15 * 60 * 1000;
const NOT_CONFIGURED = "Утасны баталгаажуулалт одоогоор идэвхгүй байна.";

async function startSession(purpose: "link_phone" | "reset_password", userId: string, phone: string): Promise<StartResult> {
  const code = String(randomInt(100000, 1000000));
  let session;
  try {
    session = await createVerifyMnSession(phone, code);
  } catch (error) {
    console.error("Verify.MN session failed", { purpose, status: error instanceof VerifyMnError ? error.status : "network" });
    return { error: "Баталгаажуулалт эхлүүлж чадсангүй. Түр хүлээгээд дахин оролдоно уу." };
  }
  const { data, error } = await createAdminClient().from("phone_verifications").insert({
    provider_session_id: session.sessionId, purpose, user_id: userId, phone, code, expires_at: session.expiresAt,
  }).select("id").single();
  if (error || !data) return { error: "Баталгаажуулалт эхлүүлж чадсангүй." };
  return { challenge: { id: data.id, phone, code: session.text, shortcode: session.shortcode, smsUri: session.smsUri, expiresAt: session.expiresAt } };
}

/** Logged-in student links a phone number to their account (onboarding and settings). */
export async function startPhoneLink(rawPhone: string): Promise<StartResult> {
  if (!isVerifyMnConfigured()) return { error: NOT_CONFIGURED };
  const phone = normalizeMongolianPhone(rawPhone);
  if (!phone) return { error: "8 оронтой утасны дугаараа оруулна уу." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Дахин нэвтэрнэ үү." };
  if (!await rateLimit("phone-link", user.id, 5, 3600)) return { error: RATE_LIMIT_MESSAGE };
  const { data: owner } = await createAdminClient().from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (owner && owner.id !== user.id) return { error: "Энэ дугаар өөр бүртгэлд холбогдсон байна." };
  if (owner) return { error: "Энэ дугаар таны бүртгэлд аль хэдийн холбогдсон байна." };
  return startSession("link_phone", user.id, phone);
}

/** Anyone can start a reset for a phone number that is verified on some account. */
export async function startPasswordReset(rawPhone: string): Promise<StartResult> {
  if (!isVerifyMnConfigured()) return { error: NOT_CONFIGURED };
  const phone = normalizeMongolianPhone(rawPhone);
  if (!phone) return { error: "8 оронтой утасны дугаараа оруулна уу." };
  const ip = await clientIp();
  if (!await rateLimit("reset-ip", ip, 10, 3600) || !await rateLimit("reset-phone", phone, 3, 3600)) return { error: RATE_LIMIT_MESSAGE };
  const { data: profile } = await createAdminClient().from("profiles").select("id").eq("phone", phone).not("phone_verified_at", "is", null).maybeSingle();
  if (!profile) return { error: "Энэ дугаар ямар нэг бүртгэлд холбогдоогүй байна. Бүртгэлдээ утсаа баталгаажуулаагүй бол бидэнтэй холбогдоно уу." };
  return startSession("reset_password", profile.id, phone);
}

/** Polled by the browser every few seconds. Asks Verify.MN directly; the browser's word is never trusted. */
export async function checkPhoneVerification(id: string): Promise<CheckResult> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { status: "expired" };
  if (!await rateLimit("phone-check", await clientIp(), 300, 600)) return { status: "pending", error: RATE_LIMIT_MESSAGE };
  const admin = createAdminClient();
  const { data: row } = await admin.from("phone_verifications").select("*").eq("id", id).maybeSingle();
  if (!row || row.consumed_at) return { status: "expired" };
  if (row.purpose === "link_phone") {
    const { data: { user } } = await (await createClient()).auth.getUser();
    if (user?.id !== row.user_id) return { status: "expired" };
  }
  if (!row.verified_at) {
    if (new Date(row.expires_at) < new Date()) return { status: "expired" };
    let status;
    try { status = await getVerifyMnStatus(row.provider_session_id); }
    catch { return { status: "pending" }; }
    if (status === "EXPIRED") return { status: "expired" };
    if (status === "PENDING") return { status: "pending" };
    const verifiedAt = new Date().toISOString();
    await admin.from("phone_verifications").update({ verified_at: verifiedAt }).eq("id", id).is("verified_at", null);
    row.verified_at = verifiedAt;
  }
  if (row.purpose === "link_phone") {
    const { error } = await admin.from("profiles").update({ phone: row.phone, phone_verified_at: row.verified_at }).eq("id", row.user_id);
    // Verifying the phone is the last required onboarding step.
    if (!error) await admin.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", row.user_id).is("onboarded_at", null).not("target_exam", "is", null);
    await admin.from("phone_verifications").update({ consumed_at: new Date().toISOString() }).eq("id", id);
    if (error) return { status: "expired", error: error.code === "23505" ? "Энэ дугаар өөр бүртгэлд холбогдсон байна." : "Дугаарыг хадгалж чадсангүй." };
    revalidatePath("/dashboard/settings");
  }
  return { status: "verified" };
}

/** Sets a new password once the reset session is verified, then signs the student in. */
export async function resetPasswordWithPhone(id: string, password: string, confirm: string): Promise<{ error?: string }> {
  if (password.length < 8) return { error: "Нууц үг 8-аас дээш тэмдэгттэй байна." };
  if (password !== confirm) return { error: "Нууц үгнүүд таарахгүй байна." };
  const admin = createAdminClient();
  const { data: row } = await admin.from("phone_verifications").select("*").eq("id", id).eq("purpose", "reset_password").maybeSingle();
  if (!row?.verified_at || row.consumed_at || Date.now() - new Date(row.verified_at).getTime() > RESET_WINDOW_MS) return { error: "Баталгаажуулалтын хугацаа дууссан. Дахин эхлүүлнэ үү." };
  const { data: updated, error } = await admin.auth.admin.updateUserById(row.user_id, { password });
  // A rejected password leaves the verification usable, so the student can retry within the window.
  if (error || !updated.user) return { error: error?.code === "weak_password" ? "Нууц үг хангалтгүй байна. Илүү урт нууц үг ашиглана уу." : "Нууц үгийг шинэчилж чадсангүй." };
  await admin.from("phone_verifications").update({ consumed_at: new Date().toISOString() }).eq("id", id);
  if (updated.user.email) {
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: updated.user.email, password });
    if (!signInError) redirect("/dashboard");
  }
  redirect("/login?reset=1");
}
