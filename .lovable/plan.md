## Diagnose

`service.schema("auth").from("users")` schlägt fehl mit `Invalid schema: auth` — der supabase-js Client erlaubt nur Schemas, die in der PostgREST-Konfiguration (`db-schemas`) exponiert sind. Das Auth-Schema ist bewusst nicht über die Data-API erreichbar, auch nicht mit Service-Role-Key.

## Fix in `supabase/functions/claim-brand/index.ts`

Statt PostgREST direkt die **GoTrue-Admin-REST-API** anfragen — die ist mit Service-Role-Key zugänglich und liefert User nach E-Mail:

```ts
const url = `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`;
const res = await fetch(url, {
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  },
});
if (!res.ok) return fail("auth_lookup_failed", `HTTP ${res.status}`);
const body = (await res.json()) as { users?: Array<{ email?: string | null }> };
const normalized = email.trim().toLowerCase();
const exists = (body.users ?? []).some(
  (u) => (u.email ?? "").toLowerCase() === normalized,
);
if (exists) return fail("already_claimed");
```

Der `filter`-Parameter macht bei GoTrue eine partielle Suche über E-Mail — deshalb der exakte Vergleich danach, damit „foo@bar.com" nicht auf „xfoo@bar.com" matcht.

Rest der Function (signUp, brands-Update) bleibt unverändert.

## Nicht Teil dieses Plans

- Keine SQL-/Schema-Änderungen extern.
- Kein Frontend-Change.
- Nach dem Umbau: extern `supabase functions deploy claim-brand`, dann Retry auf `/welcome?domain=testdomain3.ch`.