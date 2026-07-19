// Edge Function: claim-brand
// Öffentlich aufrufbar (verify_jwt = false). Erzeugt einen Auth-User per signUp
// (Anon-Client, damit Supabase die Bestätigungs-Mail selbst versendet) und
// verknüpft ihn mit dem passenden brands-Datensatz.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const REDIRECT_URL = "https://brand.winfluence.net/set-password";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const specials = "!@#$%^&*()-_=+[]{}";
  const all = upper + lower + digits + specials;
  const pick = (set: string, n: number) => {
    const buf = new Uint32Array(n);
    crypto.getRandomValues(buf);
    let out = "";
    for (let i = 0; i < n; i++) out += set[buf[i] % set.length];
    return out;
  };
  const required = pick(upper, 2) + pick(lower, 2) + pick(digits, 2) + pick(specials, 2);
  const rest = pick(all, 12);
  const arr = (required + rest).split("");
  // Fisher-Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const r = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [arr[i], arr[r]] = [arr[r], arr[i]];
  }
  return arr.join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false }, 200);

  try {
    const { domain } = (await req.json().catch(() => ({}))) as { domain?: string };
    if (!domain || typeof domain !== "string") return json({ ok: false });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const service = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const anon = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: brand, error: brandErr } = await service
      .from("brands")
      .select("id, e_mail_address, user_id")
      .ilike("domain", domain.trim())
      .maybeSingle();

    if (brandErr) {
      console.warn("brand lookup failed", brandErr.message);
      return json({ ok: false });
    }
    if (!brand || !brand.e_mail_address || brand.user_id) return json({ ok: false });

    const email = brand.e_mail_address;
    const password = generatePassword();

    const { data: signUp, error: signUpErr } = await anon.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: REDIRECT_URL },
    });

    if (signUpErr || !signUp?.user?.id) {
      console.warn("signUp failed", signUpErr?.message);
      return json({ ok: false });
    }

    // Falls "Confirm email" deaktiviert ist, versendet signUp keine Mail.
    // Ein zusätzlicher Reset-Link stellt sicher, dass der User einen Link erhält.
    if (!signUp.user.confirmation_sent_at) {
      const { error: resetErr } = await anon.auth.resetPasswordForEmail(email, {
        redirectTo: REDIRECT_URL,
      });
      if (resetErr) console.warn("reset link fallback failed", resetErr.message);
    }

    const { error: updErr } = await service
      .from("brands")
      .update({ user_id: signUp.user.id })
      .eq("id", brand.id);

    if (updErr) {
      console.warn("brand link update failed", updErr.message);
      return json({ ok: false });
    }

    return json({ ok: true });
  } catch (e) {
    console.warn("claim-brand error", (e as Error).message);
    return json({ ok: false });
  }
});
