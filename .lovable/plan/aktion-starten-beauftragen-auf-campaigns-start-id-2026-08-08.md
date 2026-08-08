# Aktion «Starten & Beauftragen» auf /campaigns/start/:id

Nur die fehlende Button-Aktion. Layout, Cards, Tabelle und Routing bleiben unverändert. Keine Datenbank-Änderungen — die bestehende Postgres-Funktion `start_campaign` wird per `supabase.rpc()` aufgerufen.

## Verhalten

- Klick auf «Starten & Beauftragen» ruft `start_campaign` mit `p_campaign_id` (ID aus der Route) auf.
- Während des Aufrufs: Button zeigt animiertes Spinner-Icon + «Wird gestartet…»; beide Buttons und die AGB-Checkbox sind deaktiviert. Ein zweiter Aufruf ist ausgeschlossen (disabled + Guard im Handler).
- Erfolg: Toast «Kampagne gestartet – die Influencer werden benachrichtigt.», Navigation auf `/campaigns?status=running`, Caches der Kampagnenliste und des Kampagnen-Details werden invalidiert.
- Fehler: Rote Meldung unterhalb der Card «Starten und beauftragen»: «Die Kampagne konnte nicht gestartet werden. Bitte kontaktiere den Support.» plus klein die technische `error.message`. Buttons und Checkbox bleiben deaktiviert, kein Retry, keine Navigation.
- Der CTA bleibt wie bisher deaktiviert, solange die AGB-Checkbox nicht angehakt ist bzw. keine Influencer vorhanden sind.

## Technische Umsetzung

- `src/routes/_authenticated/campaigns.start.$id.tsx`: `useMutation` mit `mutationFn`, die `supabase.rpc('start_campaign', { p_campaign_id: campaignId })` aufruft und bei `error` wirft (Muster analog `campaigns.publish.$id.tsx`).
  - `onSuccess`: `toast.success(...)`, `qc.invalidateQueries` für `["campaigns"]`, `["home","campaigns"]`, `["campaign", campaignId]`, dann `navigate({ to: "/campaigns", search: { status: "running" } })`.
  - `onError`: Fehlerobjekt in lokalem State halten und unterhalb der Card rendern (`text-destructive` bzw. `text-xs text-muted-foreground` für das Detail).
  - Disabled-Logik: `mutation.isPending || mutation.isError` sperrt CTA, Abbrechen-Button und Checkbox.
  - Spinner via `Loader2` aus `lucide-react` mit `animate-spin`.
- `src/locales/de.json`: bestehende Keys unter `campaigns.start.*` erweitern/anpassen — `loading` («Wird gestartet…»), `successToast` («Kampagne gestartet – die Influencer werden benachrichtigt.»), `errorMessage` («Die Kampagne konnte nicht gestartet werden. Bitte kontaktiere den Support.»). Keine hartcodierten Strings.

## Backend

Keine Migrations, keine Edge Functions, kein Lovable Cloud. Nur Aufruf der vorhandenen RPC über den bestehenden externen Supabase-Client.
