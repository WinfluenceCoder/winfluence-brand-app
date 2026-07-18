## Neue öffentliche Route `/welcome`

### Datei
- `src/routes/welcome.tsx` (public, kein `_authenticated`-Gate)

### Ablauf
1. **Session einholen (Invite-Link)**
   - Beim Mount: `supabase.auth.getSession()` prüfen, zusätzlich `onAuthStateChange` abonnieren, um die durch `detectSessionInUrl` gesetzte Session nach Redirect abzufangen.
   - Ladezustand: "Invite wird verarbeitet …".
   - Timeout ~5 s ohne Session → Fehlerzustand: "Der Einladungslink ist ungültig oder abgelaufen. Bitte kontaktiere das Winfluence-Team für einen neuen Link." (kein Formular).

2. **Formular** (nur wenn Session vorhanden)
   - E-Mail: read-only Input, Wert aus `session.user.email`.
   - Passwort + Passwort-Bestätigung (mit Show/Hide-Toggle wie in `/login`).
   - Live-Kriterienliste (Checkmarks grün / grau):
     - Mindestens 8 Zeichen
     - Mindestens ein Großbuchstabe
     - Mindestens ein Kleinbuchstabe
     - Mindestens eine Zahl
     - Passwörter stimmen überein
   - Submit-Button disabled, bis alle Kriterien erfüllt.

3. **Submit-Handler**
   - `supabase.auth.updateUser({ password })`
   - Danach `supabase.from("brands").update({ status: "active" }).eq("e_mail_address", session.user.email)`
   - Bei Erfolg: Toast + `navigate({ to: "/" })` (User ist bereits eingeloggt, kein zusätzlicher Sign-in).
   - Fehler: Toast mit gemappter Fehlermeldung (Reuse `mapAuthError`-Logik analog `/login`).

### Zustände
- `loading` (Session-Check läuft)
- `invalid` (kein Session zustande gekommen)
- `ready` (Formular sichtbar)
- `submitting`

### i18n
- Neue Keys unter `welcome.*` in `src/locales/de.json` (Titel, Kriterien, Fehlermeldung Invite ungültig, Success-Toast, Button-Label).

### Nicht enthalten
- Keine Backend-/Schema-Änderungen.
- Kein Server-Function-Aufruf; alle Calls direkt via Browser-Supabase-Client (User ist eingeloggt, RLS auf `brands` muss Update auf eigene Zeile via `e_mail_address` = `auth.email()` bzw. `user_id` erlauben — falls Policy fehlt, meldet Supabase 403; das ist DB-seitig zu konfigurieren, außerhalb dieses Codes).
