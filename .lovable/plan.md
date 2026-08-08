# Fix: «Cannot read properties of undefined (reading 'rest')» auf /campaigns/start/:id

## Ursache

In `src/routes/_authenticated/campaigns.start.$id.tsx` (Zeile 114) wird die Methode aus dem Client herausgelöst:

```ts
const rpc = supabase.rpc as unknown as (...)
await rpc("start_campaign", { ... })
```

Der exportierte `supabase` ist ein Proxy (`src/integrations/supabase/client.ts`). Wird `rpc` in eine Variable kopiert und separat aufgerufen, fehlt die `this`-Bindung an den Client — intern greift supabase-js dann auf `this.rest` zu, was `undefined` ist. Genau daher die Meldung. Die RPC selbst wird nie erreicht.

Die anderen Aufrufstellen im Projekt (`src/routes/login.tsx`, `src/routes/welcome.tsx`) rufen den Cast direkt als Methode auf und funktionieren deshalb.

## Fix

- In `campaigns.start.$id.tsx` den Zwischenschritt entfernen und den Aufruf als Methode am Client ausführen — gleiches Muster wie in `login.tsx`:

```ts
const { data: result, error } = await (supabase.rpc as unknown as (
  fn: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>)("start_campaign", {
  p_campaign_id: campaignId,
});
```

Sonst keine Änderungen: Layout, Cards, Tabelle, Loading-/Fehler-Handling, Navigation und i18n bleiben unverändert.

## Backend

Keine Datenbank-Änderungen, keine Migrations, keine Edge Functions, kein Lovable Cloud. Die bestehende Funktion `start_campaign` wird weiterhin nur per RPC aufgerufen.
