## Diagnose

`brands.user_id` ist bei jedem Datensatz vorbelegt (Moderator-ID) — die Spalte sagt daher **nichts** darüber aus, ob eine Brand bereits geclaimt wurde. Die aktuelle Prüfung in `claim-brand`

```ts
if (brand.user_id) return fail("already_claimed");
```

ist deshalb falsch. Korrekte Semantik: „geclaimt" = es existiert in `auth.users` ein User mit der Brand-E-Mail.

## Fix in `supabase/functions/claim-brand/index.ts`

1. `brands`-Select um `user_id` reduzieren (nicht mehr benötigt für die Claim-Prüfung); nur noch `id, e_mail_address` lesen.
2. Nach dem Brand-Lookup direkt gegen `auth.users` prüfen — Service-Role darf das Auth-Schema abfragen:

   ```ts
   const { data: existingUser, error: authErr } = await service
     .schema("auth")
     .from("users")
     .select("id")
     .ilike("email", email)
     .maybeSingle();

   if (authErr) return fail("auth_lookup_failed", authErr.message);
   if (existingUser) return fail("already_claimed");
   ```
3. `signUp` wie bisher; anschließendes `brands`-Update auf `user_id = signUp.user.id` bleibt unverändert (überschreibt die Moderator-ID).

Kein Verhalten am Frontend anpassen — die bestehenden `reason`-Codes bleiben stabil (`already_claimed`, `signup_failed`, `link_failed`, …).

## Danach

1. Function extern neu deployen (`supabase functions deploy claim-brand`).
2. Test mit `testdomain3.ch` (kein Auth-User vorhanden) → erwartet: „Fast geschafft!"-Ansicht.
3. Zweiter Klick / bereits registrierte Brand → erwartet Toast `Fehler: already_claimed`.

## Nicht Teil dieses Plans

- Frontend (`welcome.tsx`) bleibt unverändert.
- Kein Reset der Moderator-`user_id` in bestehenden Zeilen nötig — das Update beim erfolgreichen Claim überschreibt sie.