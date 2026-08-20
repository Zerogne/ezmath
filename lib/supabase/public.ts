import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";
export function createPublicClient() { const { url, anonKey } = getSupabaseConfig(); return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } }); }
