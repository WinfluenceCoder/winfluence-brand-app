## Ziel
Die Edge Function `claim-brand` soll im Repo auffindbar und korrekt für das externe Supabase-Projekt deployfertig sein.

## Hintergrund
Du musst den Code manuell in dein Supabase-Projekt kopieren/deployen. Laut aktuellem Projektstand existiert die Datei `supabase/functions/claim-brand/index.ts` bereits, aber du siehst sie anscheinend nicht im Dateibaum.

## Plan

1. **Repo-Stand prüfen**
   - Überprüfen, ob `supabase/functions/claim-brand/index.ts` wirklich im aktuellen Dateisystem liegt.
   - Falls fehlend: Die Datei mit dem inhalt aus der Codebasis neu anlegen.

2. **Konfiguration prüfen**
   - Sicherstellen, dass `supabase/config.toml` den Eintrag `[functions.claim-brand] verify_jwt = false` enthält.

3. **Deployment-Optionen aufbereiten**
   - Dir die beiden möglichen Wege bereitstellen:
     - **A) Supabase Dashboard (manuell):** Unter Edge Functions → New Function den Code hineinkopieren, wobei die Umgebungsvariablen (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`) automatisch verfügbar sind.
     - **B) Supabase CLI:** `supabase functions deploy claim-brand` im Projektverzeichnis ausführen.
   - Hinweis: Der Edge Function Code wird unverändert kopiert; die `supabase/config.toml` ist für die CLI nötig, für das Dashboard nur optional.

4. **Code-Validierung**
   - Kurz prüfen, ob der aktuelle Code alle Anforderungen aus dem Onboarding-Flow erfüllt:
     - CORS-Handler für OPTIONS/POST
     - Brand-Lookup via `service` Client
     - Zufallspasswort-Generierung
     - `anon.auth.signUp` mit `emailRedirectTo`
     - Fallback `resetPasswordForEmail` falls keine confirmation-Mail versendet wird
     - `brands.user_id` Update via service client

## Erwartetes Ergebnis
Du hast eine sichtbare, deployfertige `supabase/functions/claim-brand/index.ts` und klare Anweisungen, wie du sie in dein externes Supabase-Projekt bekommst.

## Nicht im Plan
- Keine Änderung an `/welcome`, `/set-password` oder anderen Frontend-Routen.
- Keine Lovable Cloud / keine Schema-Migration.