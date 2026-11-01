"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PortalActionState = { error?: string; success?: string };

export async function updateStudentProfile(_state: PortalActionState, formData: FormData): Promise<PortalActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  if (fullName.length < 2 || fullName.length > 100) return { error: "Нэр 2–100 тэмдэгт байна." };
  if (avatarUrl && !/^https:\/\//.test(avatarUrl)) return { error: "Профайл зураг HTTPS холбоос байна." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Дахин нэвтэрнэ үү." };
  const { error } = await supabase.from("profiles").update({ full_name: fullName, avatar_url: avatarUrl || null }).eq("id", user.id);
  if (error) return { error: "Профайлыг хадгалж чадсангүй." };
  revalidatePath("/dashboard", "layout");
  return { success: "Профайл хадгалагдлаа." };
}
