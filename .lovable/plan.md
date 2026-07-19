## Problem

`/welcome` funktioniert, aber der Klick auf **„Konto anlegen"** endet in der generischen Meldung. Weder Client-Konsole noch UI zeigen die Ursache. Grund: die Edge Function `claim-brand` gibt in JEDEM Fehlerfall pauschal `{ ok: false }` zurück und der Client loggt `error`/`data` nicht.

Mögliche Ursachen (ohne Diagnose nicht entscheidbar):
1. `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` in der Function nicht gesetzt.
2. `brands.domain`-Lookup findet den Datensatz nicht (Groß/Kleinschreibung, Whitespace, anderer Spaltenname).
3. `auth.signUp` scheitert (z. B. Email schon in `auth.users` vorhanden, Rate-Limit, ungültige Redirect-URL nicht in Supabase Auth Redirect-URLs whitelisted).
4. `brands`-Update scheitert an RLS / fehlender Spalte.

## Plan: Diagnose-Ausgabe hinzufügen (nur Frontend + Function-Response)

Reine Fehlerdiagnose, keine Business-Logik-Änderung.

### 1. Edge Function `supabase/functions/claim-brand/index.ts`
- Statt pauschal `{ ok: false }` einen `reason`-Code mitliefern, z. B.:
  - `"brand_lookup_failed"` + Message
  - `"brand_not_found"`
  - `"already_claimed"`
  - `"signup_failed"` + Message
  - `"link_failed"` + Message
  - `"unexpected"` + Message
- Weiterhin HTTP 200, damit `supabase.functions.invoke` den Body liefert.
- Kein Preisgeben von Secrets — nur Supabase-Fehlermeldungen.

### 2. `src/routes/welcome.tsx`
- Bei Fehler `console.error("claim-brand", { data, error })` ausgeben.
- Toast-Text mit `reason` ergänzen, damit die Ursache sofort in der UI sichtbar ist (z. B. „Fehler: signup_failed — User already registered").

### 3. Anschluss
Nach dem nächsten Klick auf „Konto anlegen" siehst du in der Toast-Message + Browser-Konsole den konkreten Grund. Danach entscheiden wir, ob:
- ein Config-Fix in Supabase reicht (Redirect-URL whitelisten, Env-Var setzen), oder
- die Function-Logik angepasst werden muss (z. B. bestehenden Auth-User wiederverwenden statt neu anlegen).

## Technisches

- Kein Schema-Change, keine Cloud-Aktivierung.
- Nach dem Function-Edit: `supabase functions deploy claim-brand` (extern durch dich).
