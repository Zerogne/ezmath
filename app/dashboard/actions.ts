"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

export type PortalActionState = { error?: string; success?: string };

const AVATAR_BUCKET = "avatars";
const AVATAR_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export async function updateStudentProfile(_state: PortalActionState, formData: FormData): Promise<PortalActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (fullName.length < 2 || fullName.length > 100) return { error: "Нэр 2–100 тэмдэгт байна." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Дахин нэвтэрнэ үү." };
  const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
  if (error) return { error: "Профайлыг хадгалж чадсангүй." };
  revalidatePath("/dashboard", "layout");
  return { success: "Профайл хадгалагдлаа." };
}

/** Public bucket for profile photos; created on first use with type and size limits. */
async function avatarBucket() {
  const admin = createAdminClient();
  const settings = { public: true, allowedMimeTypes: Object.keys(AVATAR_TYPES), fileSizeLimit: AVATAR_MAX_BYTES };
  const { data } = await admin.storage.getBucket(AVATAR_BUCKET);
  if (!data) {
    const { error } = await admin.storage.createBucket(AVATAR_BUCKET, settings);
    if (error && !error.message.toLowerCase().includes("already")) throw new Error("Avatar bucket could not be created");
  }
  return admin.storage.from(AVATAR_BUCKET);
}

/** Older photos in the student's folder, removed after a new one is saved or the photo is cleared. */
async function removeAvatars(bucket: Awaited<ReturnType<typeof avatarBucket>>, userId: string, keep?: string) {
  const { data: files } = await bucket.list(userId);
  const stale = (files ?? []).map((file) => `${userId}/${file.name}`).filter((path) => path !== keep);
  if (stale.length) await bucket.remove(stale);
}

/** Saves an uploaded profile photo (the browser already crops it to a small square) and points the profile at it. */
export async function uploadAvatar(formData: FormData): Promise<PortalActionState & { url?: string }> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || !file.size) return { error: "Зураг сонгоно уу." };
  if (!AVATAR_TYPES[file.type]) return { error: "JPG, PNG эсвэл WEBP зураг сонгоно уу." };
  if (file.size > AVATAR_MAX_BYTES) return { error: "Зургийн хэмжээ 2MB-аас бага байна." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Дахин нэвтэрнэ үү." };
  if (!await rateLimit("avatar", user.id, 10, 3600)) return { error: RATE_LIMIT_MESSAGE };

  const bucket = await avatarBucket();
  const path = `${user.id}/${randomUUID()}.${AVATAR_TYPES[file.type]}`;
  const { error: uploadError } = await bucket.upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
  if (uploadError) return { error: "Зургийг хадгалж чадсангүй." };
  const url = bucket.getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) { await bucket.remove([path]); return { error: "Профайлыг хадгалж чадсангүй." }; }
  await removeAvatars(bucket, user.id, path);
  revalidatePath("/dashboard", "layout");
  return { success: "Профайл зураг шинэчлэгдлээ.", url };
}

export async function removeAvatar(): Promise<PortalActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Дахин нэвтэрнэ үү." };
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { error: "Профайлыг хадгалж чадсангүй." };
  await removeAvatars(await avatarBucket(), user.id);
  revalidatePath("/dashboard", "layout");
  return { success: "Профайл зураг устгагдлаа." };
}
