import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function listActiveSchools() {
  const { data, error } = await createAdminClient()
    .from("schools")
    .select("name, slug")
    .eq("is_active", true)
    .order("name");
  if (error) return [];
  return data ?? [];
}
