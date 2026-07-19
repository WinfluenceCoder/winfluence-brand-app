## Ursache

`public.brands.e_mail_address` ist UNIQUE. Der Trigger `handle_new_user()` fügt bei jedem neuen Auth-User eine Brand-Zeile ein und fängt nur `ON CONFLICT (user_id)` ab — im Claim-Flow existiert die Brand aber bereits mit dieser E-Mail (angelegt vom Moderator), also knallt die Unique-Constraint auf `e_mail_address`. Postgres wirft, GoTrue rollt den `auth.users`-Insert zurück → `Database error saving new user`.

## Drei Use Cases, die alle sauber laufen müssen

| # | Flow | Erwartetes Verhalten des Triggers |
|---|---|---|
| 1 | **Brand-Self-Signup** (andere App) | Neue Brand-Zeile anlegen |
| 2 | **Brand-Invite/Claim** (diese App, aktueller Flow) | Bestehende Brand-Zeile via `user_id` verknüpfen, KEINE neue Zeile |
| 3 | **Creator-Self-Signup** (spätere Creator-App) | GAR NICHTS in `brands` machen |

Nur an der E-Mail lassen sich diese Fälle nicht sicher unterscheiden. Der `signUp` muss dem Trigger mitteilen, in welchem Kontext er läuft — via `options.data` (landet als `raw_user_meta_data` auf `auth.users`).

## Fix — zwei kleine Änderungen

### A) Trigger extern in Supabase idempotent + rollenbewusst machen

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role         text := lower(coalesce(NEW.raw_user_meta_data->>'role', ''));
  v_email_domain text;
  v_unique_dom   text;
BEGIN
  -- Case 3: Creator-Self-Signup → keine Brand anlegen
  IF v_role = 'creator' THEN
    RETURN NEW;
  END IF;

  -- Case 2: Invite/Claim → bestehende Brand mit dieser E-Mail nur verknüpfen
  UPDATE public.brands
     SET user_id = NEW.id
   WHERE lower(e_mail_address) = lower(NEW.email)
     AND user_id IS DISTINCT FROM NEW.id;
  IF FOUND THEN
    RETURN NEW;
  END IF;

  -- Case 1: Brand-Self-Signup → neue Brand-Zeile
  v_email_domain := split_part(NEW.email, '@', 2);
  v_unique_dom   := v_email_domain || ':' || NEW.id::text;

  INSERT INTO public.brands (user_id, e_mail_address, domain)
  VALUES (NEW.id, NEW.email, v_unique_dom)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
```

Warum die Reihenfolge so:
- Creator-Marker zuerst → macht Case 3 unabhängig davon, ob zufällig eine Brand mit gleicher E-Mail existiert.
- UPDATE mit `IF FOUND` deckt Case 2 idempotent ab (verhindert Unique-Konflikt).
- INSERT nur, wenn weder Creator noch bestehende Brand → Case 1 unverändert.

Voraussetzung: Die Creator-App MUSS beim `signUp` `options: { data: { role: 'creator' } }` mitgeben. Die bestehende Brand-Self-Signup-App muss NICHTS ändern (fehlende Rolle = Default = Brand-Verhalten wie bisher).

### B) In dieser App `role: 'brand'` beim Claim-Signup mitschicken (defensiv)

In `supabase/functions/claim-brand/index.ts` beim `signUp`:

```ts
const { data: signUp, error: signUpErr } = await anon.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: REDIRECT_URL,
    data: { role: "brand" },
  },
});
```

Nicht zwingend für die Trigger-Logik (Default deckt Case 2 ohnehin ab), aber macht die Absicht explizit und schützt, falls der Trigger später strenger wird.

## Verifikation nach Deploy

1. Extern: obige `CREATE OR REPLACE FUNCTION` ausführen.
2. `supabase functions deploy claim-brand`.
3. `/welcome?domain=testdomain3.ch` → „Konto anlegen" → erwartete Ausgabe `ok: true`, Bestätigungsmail wird verschickt, `brands.user_id` ist gesetzt, kein neuer Brand-Datensatz.
4. Kurzcheck extern:
   ```sql
   SELECT id, e_mail_address, user_id FROM public.brands
   WHERE lower(e_mail_address) = 'bennoburkhardt@hotmail.com';
   ```
   Erwartet: genau eine Zeile, `user_id` = neuer Auth-User.

## Nicht Teil dieses Plans

- Keine Frontend-Änderung an `welcome.tsx` / `set-password.tsx`.
- Keine Schema-Änderung (UNIQUE bleibt bestehen — das ist korrekt).
- Creator-App existiert noch nicht; hier wird nur die Trigger-Semantik so gebaut, dass sie später sauber funktioniert.