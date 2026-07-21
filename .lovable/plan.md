## Befund

Der sichtbare Fehler kommt nicht mehr von `get_email_status`, sondern vom Auth-Signup selbst:

```text
POST /auth/v1/signup ... 500 Internal Server Error
```

Das bedeutet: Supabase Auth versucht den neuen User anzulegen, aber beim Speichern läuft eine Datenbank-Operation fehl — sehr wahrscheinlich der bestehende `on_auth_user_created` / `handle_new_user()` Trigger, der beim Erstellen eines Auth-Users automatisch in `public.brands` schreibt oder aktualisiert.

Der `brand.winfluence.net.png` 404 kommt von 1Password/Rich Icons und ist unabhängig.

## Plan

1. **Externen Trigger fixen**
   - `public.handle_new_user()` so anpassen, dass Self-Registration robust funktioniert.
   - Für neue Brand-Registrierungen darf der Trigger nicht blind einen `brands`-Datensatz einfügen, wenn Pflichtspalten, Constraints oder bestehende Brand-Logik das verhindern.
   - Der Trigger sollte stattdessen:
     - E-Mail normalisieren
     - vorhandenen Brand per `e_mail_address` aktualisieren, falls vorhanden
     - nur falls kein Brand existiert, einen minimal gültigen Brand-Datensatz anlegen
     - Konflikte auf `user_id`, `e_mail_address` und `domain` sauber behandeln

2. **Konkretes SQL für Supabase liefern**
   - Ich erstelle dir ein sicheres `CREATE OR REPLACE FUNCTION public.handle_new_user()` SQL-Snippet zum manuellen Ausführen in deinem externen Supabase-Projekt.
   - Keine Lovable Cloud, keine neue Datenbank, keine Schema-Änderung außer der bestehenden Trigger-Funktion.

3. **Frontend-Fehlermeldung verbessern**
   - In `/login` soll bei `signUp`-Fehlern mit leerem `{}` oder `Database error saving new user` eine verständliche Meldung erscheinen, z.B.:
     - „Registrierung konnte nicht abgeschlossen werden. Bitte kontaktiere das Team.“
   - Zusätzlich optional `console.warn` mit `message`, `code`, `status`, damit künftige Fehler nicht mehr leer wirken.

4. **Verifikation**
   - Danach testen mit einer neuen E-Mail ohne bestehenden Auth-User.
   - Erwartung:
     - `get_email_status` → 200
     - `auth/v1/signup` → 200 oder Bestätigungs-Mail ausgelöst
     - keine leere Toast-Meldung mehr

## Technische Details

Die wichtigste externe Prüfung ist diese Query in Supabase:

```sql
select
  n.nspname as schema,
  p.proname,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'handle_new_user';
```

Falls der Trigger aktuell wieder ein `INSERT INTO public.brands (...)` ohne vollständige Pflichtfelder macht, ist das der wahrscheinliche Grund für `Database error saving new user`.