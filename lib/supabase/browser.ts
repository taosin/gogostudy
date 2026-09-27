import type { SupabaseClient } from "@supabase/supabase-js";

let client: Promise<SupabaseClient> | null = null;

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key);
}

export async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = import("@supabase/supabase-js")
      .then(({ createClient }) => createClient(url, key))
      .catch((error) => {
        client = null;
        throw error;
      });
  }
  return client;
}
