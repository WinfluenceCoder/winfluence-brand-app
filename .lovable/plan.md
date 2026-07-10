# Winfluence BrandApp V1 — Plan

## Scope
Auth (Login, Registrierung mit Double-Opt-In, Passwort-Reset), App-Shell (Header/Sidebar/Footer), Startseite, /profile, /security, i18n-Grundgerüst, Platzhalter für alle weiteren Menüpunkte, Datenbank + RLS + Rollen + Storage-Bucket.

## Wichtiger Hinweis — Backend
Das Projekt hat bereits **Lovable Cloud** (managed Supabase) aktiv. Du hattest zuvor zusätzlich dein **eigenes externes Supabase-Projekt** (`cgqgdfvcoqcopltrxoze`) verbunden — als reiner Zweit-Client, ohne Auth-Middleware, ohne generierte Types, ohne Migrations-Tooling.

Für V1 dieser Spezifikation (Auth via Supabase, Migrations, RLS, Storage, Trigger, Types) empfehle ich klar: **Lovable Cloud als Backend nutzen**, nicht das externe Projekt. Sonst müsste die Migration manuell in der Supabase-UI deines externen Projekts laufen, es gäbe keine getypten Queries und kein Auth-Middleware-Setup — Auth-Flows würden zwar funktionieren, aber ohne die Sicherheitsgarantien (Bearer-Attacher, RLS-typed clients), die die Vorgaben implizieren.

**Frage vor Implementierung:** Backend = Lovable Cloud (empfohlen) oder dein externes Supabase? Der Rest des Plans nimmt Lovable Cloud an.

## Datenbank (eine Migration)
- Enum `app_role` ('admin','editor','viewer')
- Tabellen: `brands`, `campaigns`, `creators`, `collabs`, `user_roles` — Spalten exakt wie spezifiziert, snake_case, `created_at`/`updated_at` mit Trigger.
- Constraint-Notiz: `mwst_nr` bekommt CHECK auf Regex `^CHE-\d{3}\.\d{3}\.\d{3}$` (nullable in V1).
- `has_role(app_role)` — SECURITY DEFINER, STABLE, `search_path=public`.
- Trigger `on_auth_user_created` (auf `auth.users` insert): legt `brands`-Zeile mit `user_id`, `e_mail_address`, `domain` = Teil nach `@` an.
- RLS auf allen Tabellen mit den spezifizierten Policies (brand-eigene Zeile via `user_id`/`brand_id`, plus Rollen).
- GRANTs für `authenticated` und `service_role` auf jeder public-Tabelle.
- Storage-Bucket `brand-logos` (public read) via Tool; RLS-Policies auf `storage.objects`: Upload/Update/Delete nur wenn erster Pfad-Segment = `auth.uid()`, SELECT public.

## i18n
- `bun add react-i18next i18next`
- `src/i18n.ts` — init mit `de` als default, fallback `de`, `interpolation.escapeValue=false`.
- `src/locales/de.json` — hierarchische Keys: `common.*`, `auth.*`, `nav.*`, `header.*`, `footer.*`, `profile.*`, `security.*`, `home.*`, `placeholders.*`, `validation.*`, `toasts.*`.
- Provider in `__root.tsx` mounten. Komponenten nutzen ausschließlich `t('...')`.

## Routing (TanStack Router, file-based)
URLs englisch, UI deutsch via i18n.

Öffentlich:
- `/login` — Login + Toggle zu Registrierung (Double-Opt-In-Hinweis)
- `/reset-password` — neues Passwort setzen (nach Mail-Link, prüft `type=recovery` im Hash)
- `/signed-out` — "Sie wurden abgemeldet" + Button "Anmelden"

Geschützt (unter `_authenticated/`, Layout via managed integration):
- `/` Startseite
- `/profile`, `/security`, `/settings`
- `/campaigns/{new,drafts,published,running,expired,completed,archive}`
- `/influencers/{search,current,hired,favorites}`
- `/analytics/{campaigns,influencers}`
- `/messages/{notifications,personal,system}`

Alle Nicht-Core-Seiten: gemeinsame `<Placeholder titleKey="…"/>` Komponente ("Diese Funktion ist in Kürze verfügbar.").

## App-Shell (`_authenticated/route.tsx` erweitert / Layout-Komponente)
- **Header** (rechts): Notifications-Icon → `/messages/notifications`, Zahnrad → `/settings`, User-Dropdown (Firmenname aus `brands.brand_name`, sonst E-Mail) mit Einträgen Mein Profil / Sicherheit / Abmelden. Abmelden: `queryClient.cancelQueries()` → `clear()` → `supabase.auth.signOut()` → navigate `/signed-out`.
- **Sidebar** (shadcn Sidebar, `collapsible="icon"`): breites "winfluence"-Logo, eingeklappt nur "w". Menüstruktur exakt wie spezifiziert mit Akkordeon-Gruppen (Kampagnen, Influencer, Analytics, Nachrichten). Aktive Route hervorheben.
- **Footer**: einzeilig, dezent, Platzhalter-Links (`#`).

## Datenzugriff (Profil)
- `src/lib/brands.functions.ts` mit `createServerFn` + `requireSupabaseAuth`:
  - `getMyBrand()` — SELECT eigene Zeile
  - `updateMyBrand(input)` — UPDATE mit zod-Validierung serverseitig
- Client: `useSuspenseQuery` in `/profile`.

## /login (öffentlich)
Modi Login / Register togglebar.
- Login: `supabase.auth.signInWithPassword`. Fehlerbehandlung deutsch (Invalid credentials, Email not confirmed, Netzwerk).
- Register: `supabase.auth.signUp` mit `emailRedirectTo: ${origin}/`. Danach Hinweis "Bitte bestätigen Sie Ihre E-Mail-Adresse."
- Link "Passwort vergessen?" → `resetPasswordForEmail(email, { redirectTo: ${origin}/reset-password })`.

## /reset-password
Public. Prüft recovery-Session, zeigt Formular für neues Passwort, `supabase.auth.updateUser({password})`, danach Redirect `/login`.

## /` (Startseite)
- Loader-Read über TanStack Query: `campaigns` mit `status in ('draft','published','running','expired','ended')` für eigene brand.
- Wenn leer: Empty-State-Kachel "Neue Kampagne" → `/campaigns/new`.
- Sonst: Tabelle (Name, Status-Badge, Start, Ende, Budget) + Button oben rechts "Neue Kampagne".

## /profile
`react-hook-form` + `zod`. Abschnitte "Firma" und "Ansprechperson" mit den spezifizierten Feldern, Read-only-Felder ausgegraut, CH-Mobile-Regex, Geschlecht-Mapping auf `is_male`/`is_female`.
Logo-Upload: `supabase.storage.from('brand-logos').upload(\`${userId}/logo-${ts}.ext\`, file, { upsert:true })`, Public-URL → `logo_url`.
Speichern-Button ruft `updateMyBrand`. Toast "Profil gespeichert".
Link "Profil löschen": ausgegraut, kein Handler.

## /security
E-Mail read-only anzeigen. Button "Passwort zurücksetzen" → `resetPasswordForEmail(email, {redirectTo: /reset-password})`, Bestätigungs-Toast.

## Design
- Inter via `<link>` in `__root.tsx` head (kein CSS-Import).
- `src/styles.css`: weiß, Business-Stil, Inter als `--font-sans`; shadcn-Tokens beibehalten aber neutralisieren (kein Farbverlauf, klare Struktur à la Brevo).
- Semantische Tokens für sidebar, header, muted usw. — keine hartkodierten Farben in Komponenten.

## Reihenfolge der Umsetzung (Build-Modus)
1. Migration (Tabellen + Enum + Trigger + RLS + GRANTs + `has_role`) + Storage-Bucket + Storage-RLS.
2. Dependencies: `react-i18next`, `i18next`, `zod`, `react-hook-form`, `@hookform/resolvers`.
3. i18n Setup + `de.json`.
4. Auth-Flows: `/login`, `/reset-password`, `/signed-out`.
5. App-Shell (Sidebar/Header/Footer) im `_authenticated`-Layout.
6. `/profile`, `/security`, `/` (Startseite).
7. Platzhalter-Routen für alle Menüpunkte.
8. Verifikation: Build + Playwright-Screenshot Login/Sidebar/Profile.

## Offene Fragen
1. **Backend**: Lovable Cloud (empfohlen) oder externes Supabase `cgqgdfvcoqcopltrxoze`?
2. **Registrierung**: Double-Opt-In laut Spec — Supabase-Auth-Einstellung `auto_confirm_email` bleibt aus (Default). OK?
3. Soll ich den externen-Supabase-Test (`/external-check`, `src/integrations/external-supabase/*`) entfernen, wenn wir auf Lovable Cloud gehen?
