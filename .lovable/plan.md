# Schritt 4: Lieferung genehmigen + Spalten-Split auf `/campaigns/monitor/$id`

Kein Schema-Change durch Lovable: Enum `collab_approval`, `collabs.approval` und die Tabelle `favorites` (inkl. RLS) werden separat von Benno migriert. Alle Writes laufen über den bestehenden Client `@/integrations/supabase/client`.

## Teil A – Genehmigungs-Panel im CollabDialog

Neue optionale Props: `campaignId?: number`, `brandId?: number`. Nur wenn beide gesetzt sind und `collabStatus(collab) === "delivered"`, erscheint der Flow (Curate übergibt sie nicht, bleibt damit unverändert im Verhalten).

Fusszeile wird auf `flex justify-between` umgestellt: links der neue Primary-Button, rechts Schliessen/`actions` wie heute.

Kaskadierendes Panel oberhalb der Fusszeile (unter einem `Separator`):

1. Zwischentitel «Lieferung genehmigen».
2. **Auftragserfüllung**: shadcn `Select` (leer als Default) mit `rejected` / `approved` / `expectations_exceeded`; speichert bei Auswahl sofort `collabs.approval`.
3. **Bewertung des Resultates** (sichtbar sobald `approval` gesetzt): eigenes `StarRating` mit 5 lucide-`Star`, Klick auf höchsten gefüllten Stern setzt auf `null` zurück, `role="radiogroup"` mit Pfeiltasten und `aria-label`; jeder Klick speichert `brand_rating`.
4. **Mitteilung an den Creator** (sichtbar sobald `brand_rating >= 1`): `Textarea` mit Zähler `x/20` und Hinweis unter 20 Zeichen; `onBlur` speichert `brand_feedback` nur ab 20 Zeichen.
5. **Favoriten-Schalter** (sichtbar sobald gespeichertes Feedback ≥ 20 Zeichen): `Switch`, Initialwert aus einem `favorites`-Lookup (`maybeSingle`) beim Öffnen des Panels, danach nur lokaler State.

Button: initial enabled, erster Klick klappt das Panel aus und setzt ihn disabled; enabled erst wenn `approval` + `brand_rating` + gespeichertes Feedback (≥20) vorliegen. Bei `rejected` wechselt die Caption auf «Lieferung zurückweisen», Variante `destructive`. Sind die DB-Felder beim Öffnen bereits teilweise gefüllt (Status noch `delivered`), rendert das Panel sofort ausgeklappt und vorbefüllt.

Finaler Klick als TanStack-Mutation:
- `rejected` → `status = 'rejected'`, Toast «Lieferung zurückgewiesen».
- `approved` / `expectations_exceeded` → `status = 'approved'`; Schalter on → `upsert` in `favorites` mit `onConflict: "brand_id,creator_id", ignoreDuplicates: true`; Schalter off obwohl vorher Favorit → Zeile löschen; Toast «Lieferung genehmigt».
- Beides: Dialog schliessen und `queryClient.invalidateQueries({ queryKey: ["campaign-monitoring", campaignId] })`, kein Reload.

Alle Writes optimistisch im lokalen State; Fehler → Toast mit Fehlermeldung und State-Rollback. Toasts über `sonner` (im Projekt vorhanden).

## Teil B – Loader, rechte Spalte, Karten, Performance

- `src/lib/campaign-monitoring.ts`: Statusfilter um `approved` und `rejected` erweitern, `approval` in Select und `MonitoringCollab` (`"rejected" | "approved" | "expectations_exceeded" | null`) aufnehmen; `collab-dialog.ts` erhält `approved`/`rejected` in `COLLAB_STATUSES` bzw. `approval` im Datenvertrag.
- Monitor-Route: rechte Spalte zeigt oben `delivered` + `approved` (Sortierung unverändert), darunter – nur wenn vorhanden – ein `Separator` und die `rejected`-Collabs. Kein zusätzlicher Titel.
- `MonitoringCreatorCard`: `approved` grünes Badge (`bg-emerald-600 text-white border-transparent`), `rejected` dezent rot (`bg-red-50 text-red-700 border-red-200` plus Dark-Mode-Varianten), `delivered` bleibt schwarz. Beide nutzen weiter Karten-Variante B mit Content-Metriken, eCPE, `delivery_note` und External-Link-Icon.
- `MonitoringPerformanceCard` erhält `collabs` (delivered + approved) für alle Kennzahlen und zusätzlich `barterCount` (delivered + approved + rejected), da das Barter-Produkt auch bei Zurückweisung versandt wurde.
- Monitor-Route übergibt `brand_id` der Kampagne an den Dialog; `getMyCampaign` selektiert bereits `*`, also kein Loader-Change nötig.

## i18n

Neuer Namespace `collabDialog.approval.*` mit allen Strings aus der Vorgabe. `creatorStatusLabel` bezieht seine Labels aus `creatorsList.status.*`; dort kommen `approved` («genehmigt») und `rejected` («zurückgewiesen») dazu (statt eines neuen `creatorStatus`-Namespace). Keine hardcodierten Strings.

## Nicht angefasst

`src/lib/campaign-curation.ts`, `CreatorMiniCard.tsx`, `CampaignCalculationCard.tsx`, `CurationBoard.tsx`, `creator-profile/*`. Keine Migration, keine Policy, keine neue Dependency.
