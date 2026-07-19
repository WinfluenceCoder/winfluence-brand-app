## Ziel

Auf allen Auth-Formularen in `src/routes/login.tsx` (Login, Registrierung, Passwort vergessen) E-Mail-Adressen mit Domain `@winfluence.net` clientseitig blockieren. Formular wird nicht abgeschickt, stattdessen erscheint eine Fehlermeldung unter dem E-Mail-Feld.

## Umfang

- Betroffen: `src/routes/login.tsx` — dort werden `signInWithPassword`, `signUp` und `resetPasswordForEmail` aufgerufen. Alle drei Sub-Formulare (`login`, `register`, `forgot`) teilen sich bereits das Zod-`email`-Schema.
- Nicht betroffen: `src/routes/reset-password.tsx` (setzt nach Recovery-Link nur ein neues Passwort, kein E-Mail-Feld). `src/routes/welcome.tsx` und die Edge Function `claim-brand` arbeiten mit der aus der DB gelesenen Brand-E-Mail — Brands haben per Definition keine `@winfluence.net`-Adresse, hier ist keine zusätzliche Sperre nötig.
- Kein Serverseiten-/Backend-Change (keine Änderung an Trigger, Edge Function, RLS oder Supabase-Konfiguration).

## Umsetzung

### 1. Zod-Schema erweitern (`src/routes/login.tsx`)

Das gemeinsame `email`-Schema (aktuell `z.string().trim().email(...).max(255)`) um eine `.refine(...)`-Regel ergänzen, die Adressen mit Endung `@winfluence.net` (case-insensitive) ablehnt und einen i18n-Key als Fehlertext verwendet, z. B. `t("auth.errors.emailDomainBlocked")`.

Da alle drei Formulare (`login`, `register`, `forgot`) dieses Schema teilen, greift die Regel automatisch überall — sowohl bei Blur/Submit-Validierung als auch beim Klick auf den Submit-Button. `handleSubmit` von React Hook Form ruft die Supabase-Funktion erst nach erfolgreicher Validierung auf, das Formular wird also nicht abgeschickt.

### 2. Übersetzung ergänzen (`src/locales/de.json`)

Neuen Key `auth.errors.emailDomainBlocked` mit einem klaren Text hinzufügen, z. B. „E-Mail-Adressen mit der Domain @winfluence.net sind in dieser App nicht erlaubt."

Falls weitere Sprachen-Dateien existieren, dort ebenfalls den Key ergänzen (nur `de.json` ist im Repo sichtbar; kurz vor Umsetzung prüfe ich `src/locales/`).

## Verifikation

1. `/login` → Tab „Anmelden": `test@winfluence.net` eingeben → Fehlertext erscheint, kein Supabase-Aufruf im Netzwerk.
2. Tab „Registrieren": `neu@winfluence.net` → gleicher Effekt.
3. Tab „Passwort vergessen": `foo@winfluence.net` → gleicher Effekt.
4. Gegencheck: `foo@example.com` in allen drei Tabs → Formular wird wie bisher abgeschickt.

## Nicht Teil dieses Plans

- Keine serverseitige Erzwingung (RLS/Trigger). Da dies eine reine Business-Regel für die BrandApp ist und der Supabase-Account extern verwaltet wird, bleibt der Check bewusst clientseitig in dieser App.
- Keine Änderung am Welcome-/Claim-Flow.
- Keine Änderung an `reset-password.tsx`.
