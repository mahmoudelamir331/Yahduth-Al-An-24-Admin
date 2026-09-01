import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseConfig() {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes("your-project") &&
      !supabaseAnonKey.includes("your-anon-key"),
  );
}

export function createClient() {
  // Keep prerendering safe; pages check hasSupabaseConfig before making requests.
  return createBrowserClient(
    supabaseUrl ?? "https://missing-supabase-config.invalid",
    supabaseAnonKey ?? "missing-supabase-anon-key",
  );
}
