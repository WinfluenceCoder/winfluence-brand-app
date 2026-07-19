## Ziel

Einheitliche Passwort-Policy überall im Frontend: **min. 12 Zeichen, Groß-, Klein-, Zahl, Sonderzeichen**. Aktuell gilt sie nur in `set-password.tsx`; `login.tsx` (Registrierung) und `reset-password.tsx` prüfen nur `min(8)`.

## Umfang

- Betroffen für neue Passwörter (Registrierung + Passwortwechsel):
  - `src/routes/login.tsx` — nur das **Register**-Formular
  - `src/routes/reset-password.tsx`
  - `src/routes/set-password.tsx` (bereits konform, wird auf gemeinsame Quelle umgestellt)
- **Login-Formular** (`src/routes/login.tsx`) bleibt bei `min(8)`. Grund: Nutzer mit vor der Policy-Einführung erstellten Passwörtern müssen sich weiter anmelden können. Client-Validierung würde sie sonst grundlos aussperren, obwohl Supabase das Passwort akzeptiert.
- Kein Server-/Backend-Change (Supabase-Auth-Policy wird extern verwaltet und bleibt unangetastet).

## Umsetzung

### 1. Gemeinsames Schema + Übersetzungen

Neue Datei `src/lib/password-policy.ts` mit Factory `makeStrongPasswordSchema(t)`, die ein Zod-Schema baut:
```
z.string()
  .min(12, t("validation.password.minLength"))
  .max(200)
  .regex(/[A-Z]/, t("validation.password.upper"))
  .regex(/[a-z]/, t("validation.password.lower"))
  .regex(/[0-9]/, t("validation.password.digit"))
  .regex(/[^A-Za-z0-9]/, t("validation.password.symbol"))
```
Vorteil: Eine Quelle für alle Formulare mit i18n-Fehlermeldungen.

Zusätzlich exportiert die Datei eine Konstante `PASSWORD_POLICY_HINT_KEY = "validation.password.hint"` für den anzuzeigenden Hinweistext unter dem Passwort-Feld.

### 2. `src/locales/de.json` erweitern

Unter `validation` neue Sektion `password` ergänzen:
- `minLength`: „Mindestens 12 Zeichen."
- `upper`: „Mindestens ein Grossbuchstabe."
- `lower`: „Mindestens ein Kleinbuchstabe."
- `digit`: „Mindestens eine Zahl."
- `symbol`: „Mindestens ein Sonderzeichen."
- `hint`: „Mindestens 12 Zeichen, mit Gross-/Kleinbuchstaben, Zahl und Sonderzeichen."

### 3. `src/routes/login.tsx`

- Login-Schema behält `min(8)` (bewusst milde, s. Umfang).
- Register-Schema nutzt `makeStrongPasswordSchema(t)`.
- Unter dem Passwort-Feld im Register-Tab kurzen Policy-Hinweis (`t("validation.password.hint")`) einblenden.

### 4. `src/routes/reset-password.tsx`

- `password` und `confirm` nutzen `makeStrongPasswordSchema(t)` (für `confirm` reicht `z.string()` — Vergleich passiert per `.refine`).
- Policy-Hinweis unter dem neuen Passwort-Feld einblenden.

### 5. `src/routes/set-password.tsx`

- Lokales `passwordSchema` durch `makeStrongPasswordSchema(t)` ersetzen (identische Regeln, i18n statt hartcodierter deutscher Strings).
- Bestehenden Hinweistext auf `t("validation.password.hint")` umstellen.

## Verifikation

Für jedes betroffene Formular manuell:
1. `abc12345` → wird abgelehnt (zu kurz, fehlende Klassen).
2. `Abcdefghijk1` (11 Zeichen, kein Sonderzeichen) → abgelehnt (min. 12 + Sonderzeichen).
3. `Abcdefghijk1!` (12 Zeichen, alle Klassen) → akzeptiert.
4. Login-Tab: bestehendes 8-stelliges Passwort funktioniert weiter.

## Nicht Teil dieses Plans

- Keine Änderung am Supabase-Passwortlimit (`min_password_length`, `password_required_characters`, HIBP) — bleibt extern konfigurierbar.
- Kein visuelles Passwort-Stärke-Meter.
- Kein Zwang, bestehende schwache Passwörter zu ersetzen.
