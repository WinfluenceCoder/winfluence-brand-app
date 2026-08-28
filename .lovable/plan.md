# /monitor: Button «Kampagne beenden» aktivieren

## Ziel

Der funktionslose Button «Kampagne beenden» auf `/campaigns/monitor/$id` wird aktiviert: er ist nur enabled, wenn alle Collabs geliefert haben (keine auf `hired`/`working`) **oder** das Kampagnenende (`ende`) überschritten ist. Beim Klick wird `campaigns.status` serverseitig auf `ended` gesetzt und zur Kampagnenliste `/campaigns?status=ended` navigiert.

## Enablement-Bedingung

`canEnd = true`, wenn mindestens eine der beiden Bedingungen zutrifft:
1. `now() > campaigns.ende` (Enddatum überschritten)
2. Keine Collab im Monitoring-Ergebnis hat Status `hired` oder `working` (d.h. alle sind `delivered`, `approved` oder `rejected`)

Bei 0 Collabs tritt Bedingung 2 als wahrheitsgemäss erfüllt ein.

## Änderungen

### 1. Server-Funktion `endCampaign` — `src/lib/campaigns.functions.ts`

Neue `createServerFn` nach demselben Muster wie `publishCampaign`:

- `.middleware([requireSupabaseAuth])`, Input `{ id: number }`
- Ownership via `loadOwnedCampaign` prüfen (Select um `ende` erweitern: `"id, status, brand_id, ende"` — harmlos für bestehende Aufrufer, die nur `status` lesen)
- Status muss `running` oder `expired` sein, sonst `throw new Error("not-endable-status")`
- Bedingung serverseitig prüfen:
  - `now > ende` → OK
  - sonst: `collabs.select("status").eq("campaign_id", id)` abfragen; wenn keine Zeile `hired`/`working` hat → OK; sonst `throw new Error("not-endable-condition")`
- `update campaigns set status = 'ended', updated_at = now` mit `.eq("id", id).eq("brand_id", brand.id)`
- Return `{ ok: true }`

### 2. Monitor-Route — `src/routes/_authenticated/campaigns.monitor.$id.tsx`

- `endCampaign` via `useServerFn` importieren
- `canEnd` clientseitig berechnen (aus bereits geladenem `campaign.ende` und `monitoring.data`):
  ```ts
  const now = Date.now();
  const ende = campaign?.ende ? new Date(campaign.ende).getTime() : null;
  const expired = ende != null && !Number.isNaN(ende) && now > ende;
  const rows = monitoring.data ?? [];
  const allDelivered = rows.every(c => c.status !== "hired" && c.status !== "working");
  const canEnd = expired || allDelivered;
  ```
- Button: `disabled={!canEnd || endMutation.isPending}`
- `useMutation` mit `endCampaign`:
  - `onSuccess`: `toast.success`, `queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] })`, `queryClient.invalidateQueries({ queryKey: ["campaigns", "list"] })`, dann `navigate({ to: "/campaigns", search: { status: "ended" } })`
  - `onError`: `toast.error` mit Fehlermeldung

### 3. i18n — `src/locales/de.json`

Unter `campaigns.monitor` ergänzen:
- `"endSuccess": "Kampagne wurde beendet."`
- `"endError": "Kampagne konnte nicht beendet werden."`

## Nicht Teil dieser Änderung

- Keine Schema-Änderung, keine Migration, kein Lovable Cloud
- Die `/campaigns/end/$id` Stub-Route bleibt unangetastet (Workflow-Konfigikation verweist dorthin, aber der Monitor-Button macht seinen eigenen Server-Fn-Aufruf)
- `docs/campaign-workflow.md` und `campaign-workflow.ts` bleiben unverändert — der `end`-Workflow-Eintrag existiert bereits
