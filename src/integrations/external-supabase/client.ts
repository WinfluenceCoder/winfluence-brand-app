import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_EXTERNAL_SUPABASE_URL as string;
const key = import.meta.env.VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY as string;

if (!url || !key) {
  console.warn("External Supabase env vars are missing.");
}

// Separate client for the user's external Supabase project.
// Uses a distinct storageKey so it doesn't collide with the Lovable Cloud client.
export const externalSupabase = createClient(url, key, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "external-sb-auth",
  },
});
