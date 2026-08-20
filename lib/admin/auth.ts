import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type AdminIdentity = { id: string; name: string; email: string };

export const getAdminIdentity = cache(async (): Promise<AdminIdentity | null> => {
  if (process.env.ADMIN_DEMO_MODE === "true") return { id: "demo-admin", name: "Demo Admin", email: "admin@alphamath.mn" };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("id, full_name, role").eq("id", user.id).eq("role", "admin").maybeSingle();
  if (!data) return null;
  return { id: data.id, name: data.full_name ?? "Admin", email: user.email ?? "" };
});
