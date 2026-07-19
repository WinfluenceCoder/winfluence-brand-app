## Ziel
Neuer Brand-Onboarding-Flow via `/welcome?domain=…`, Edge Function `claim-brand`, `/set-password`. RPC `get_welcome_info` existiert bereits in der DB.

## Umzusetzen

### 1. Neue öffentliche Route `src/routes/welcome.tsx`
- Liest `domain` aus Query (via `Route.useSearch()` mit Zod-Schema).
- Ruft `supabase.rpc('get_welcome_info', { p_domain: domain })` auf.
- Wenn `!found || claimed` → `navigate({ to: '/login', replace: true })` (still, keine Meldung).
- Sonst: Karten-Layout ähnlich `/login` (gleiches Logo, `bg-muted/30`), zeigt:
  „Hallo {first_name}! {sales_rep} hat dein Dossier bereits vorbereitet. Konto mit {email_masked} anlegen?"
- Button „Konto anlegen" → `supabase.functions.invoke('claim-brand', { body: { domain } })`.
- Bei `ok: true`: Karte ersetzen durch Erfolgsmeldung „Wir haben dir eine Nachricht an {email_masked} geschickt." (kein Redirect).
- Bei Fehler / `ok: false`: neutraler Toast, kein Detail-Leak.
- Lade-/Submitting-States, Route ist NICHT unter `_authenticated/`.

### 2. Neue öffentliche Route `src/routes/set-password.tsx`
- Kartenlayout wie `/login`.
- On mount: `supabase.auth.getSession()`; wenn keine Session → Hinweistext „Bitte melde dich beim Team." (kein Formular).
- Sonst: Formular mit
  - E-Mail read-only (aus `session.user.email`),
  - Passwort + Bestätigung (react-hook-form + zod),
  - **Policy: min. 12 Zeichen, mind. 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl, 1 Sonderzeichen**; Live-Validierung; Bestätigung muss matchen.
- Submit: `supabase.auth.updateUser({ password })`, danach `supabase.from('brands').update({ status: 'active' }).eq('user_id', session.user.id)`.
- Erfolg: `navigate({ to: '/', replace: true })`.
- Fehler → Toast über kleinen lokalen Auth-Error-Mapper.

### 3. Edge Function `supabase/functions/claim-brand/index.ts`
- Deno-Function, `verify_jwt = false` in `supabase/config.toml`.
- CORS-Header (OPTIONS + POST), JSON-Body `{ domain: string }`.
- Zwei Clients:
  - `serviceClient` mit `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`,
  - `anonClient` mit `SUPABASE_URL` + `SUPABASE_ANON_KEY` (nur für `signUp`).
- Ablauf:
  1. Brand per `serviceClient.from('brands').select('id, e_mail_address, user_id, first_name').ilike('domain', domain.trim())` laden.
  2. Guards: keine Row / `user_id` gesetzt → `{ ok: false }`. Doppelter Auth-User wird über den `signUp`-Fehler abgefangen (kein `admin.listUsers`).
  3. Zufälliges Passwort (16 Zeichen, min. je 1 Groß/Klein/Zahl/Sonderzeichen; via `crypto.getRandomValues`).
  4. `anonClient.auth.signUp({ email, password, options: { emailRedirectTo: 'https://brand.winfluence.net/set-password' } })`.
  5. Wenn kein `user.id` (Confirm-Email aus): zusätzlich `resetPasswordForEmail(email, { redirectTo: 'https://brand.winfluence.net/set-password' })`.
  6. `serviceClient.from('brands').update({ user_id: newUserId }).eq('id', brand.id)`.
  7. `{ ok: true }`.
- Alle Fehlerpfade returnen `{ ok: false }` mit Status 200, Details nur in Server-Logs.

### 4. `supabase/config.toml`
- Function-Eintrag für `claim-brand` mit `verify_jwt = false` hinzufügen.

### 5. RLS-Hinweis (Teil 4)
- SQL-Snippets bereitstellen (Brand darf eigenen Record via `user_id = auth.uid()` lesen/aktualisieren; Status-Update nur auf `'active'`). Ausführung durch dich im Supabase-SQL-Editor, keine Migration in diesem Projekt.

## Nicht Teil des Plans
- Keine Änderung an `/login`, `/reset-password`, Sidebar.
- Keine neuen npm-Pakete.
- Keine Anpassung der existierenden RPC `get_welcome_info`.

## Annahmen
- Brand-Status nach Passwortsetzung: `'active'`.
- Texte deutsch, inline (ohne neue i18n-Keys).
