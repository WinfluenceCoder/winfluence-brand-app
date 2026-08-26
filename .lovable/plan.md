# ECPE auf CreatorCard (Curate)

Ergänzung der Creator-Karte auf `/campaigns/curate/$id` um den Kennwert **ECPE** (Expected Cost per Engagement), rechtsbündig und hervorgehoben auf derselben Zeile wie die Instagram-Follower.

## Was sich für dich ändert

- Auf jeder Creator-Karte erscheint rechts in der Social-Stat-Zeile (dieselbe Zeile wie Instagram/TikTok/YouTube) ein hervorgehobener Wert «ECPE: 0.05» (ohne CHF-Präfix).
- Berechnet aus Instagram-Followern × Engagement-Rate und dem Collab-Preis.
- Fehlen Instagram-Follower, Engagement-Rate oder Preis → zeigt `–`.

## Formel

```
E  = instagram_followers * (instagram_engagement_rate / 100)   // erwartete Engagements
P  = collab.price
ECPE = P / E
```

`instagram_engagement_rate` liegt bereits in Prozent (z. B. 11.3 = 11.3 %), daher /100.

Grenzfälle → `–`:
- `instagram_followers` ist `null` oder `0`
- `instagram_engagement_rate` ist `null`
- `collab.price` ist `null`

## Umsetzung

### `src/components/app/CreatorMiniCard.tsx`

In `CreatorMiniCardBody`:
- ECPE in einem `useMemo` (oder direkt) berechnen aus `collab.creator.instagram_followers`, `collab.creator.instagram_engagement_rate`, `collab.price`.
- In der Social-Stat-Zeile (`<div className="flex flex-wrap items-center gap-3">…</div>`) am Ende ein Element mit `ml-auto` einfügen, das den Wert rechtsbündig und hervorgehoben darstellt:
  ```tsx
  <span
    className="ml-auto shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary"
    title={t("creatorCard.ecpeTitle")}
  >
    {ecpe != null ? `ECPE: ${formatEcpe(ecpe)}` : "ECPE: –"}
  </span>
  ```
  `formatEcpe` liefert eine reine Zahl (z. B. `0.0516`), kein CHF-Präfix.
  «Hervorgehoben» = `text-primary` + dezenter `bg-primary/10`-Hintergrund (passt zum bestehenden Design-System, keine hartcodierten Farben).
- Die ECPE-Berechnung wird auch dann gerendert, wenn kein Social-Stat vorhanden ist (die Zeile existiert immer, da ECPE nicht von einer Social-URL abhängt). Die Zeile soll also immer gerendert werden, nicht nur wenn mindestens ein Social-Stat gesetzt ist — dafür nötigenfalls die `flex-wrap`-Zeile immer ausgeben (aktuell wird sie immer gerendert, SocialStat gibt nur intern `null` zurück; also keine Strukturänderung nötig).

### Formatierung `formatEcpe`

ECPE-Werte sind oft klein (< 0.10) und sollen ohne CHF-Präfix als reine Zahl erscheinen. Neue Helferfunktion in `src/lib/campaign-curation.ts`:

```ts
const ef = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});
export function formatEcpe(value: number | null | undefined): string {
  return ef.format(value ?? 0);
}
```

So bleibt `0.0516` sichtbar; ab 1 reicht die Standardanzeige (z. B. `1.25`).

### i18n (`src/locales/de.json`)

Unter `creatorCard` ergänzen:
```json
"ecpeTitle": "Expected Cost per Engagement (Preis / (Follower × Engagement-Rate))"
```

Sichtbares Label «ECPE:» bleibt hartkodiert (wie «–»), da es als kennzahlenartige Abkürzung sprachneutral ist — analog zu bestehenden hartkodierten «n/a».

## Nicht Teil dieses Schritts

- Keine Änderung an `MonitoringCreatorCard.tsx` (Monitoring folgt separat).
- Keine Änderung an `CampaignCalculationCard.tsx`, an den Queries oder am Datenmodell.
- Keine Schema- oder Policy-Änderungen, kein Lovable Cloud.

## Abnahme

- `/campaigns/curate/$id`: Jede Creator-Karte zeigt rechts in der Social-Zeile ein hervorgehobenes «ECPE: CHF …».
- Wert = `price / (instagram_followers × engagement_rate/100)`.
- Creators ohne Instagram-Stats oder Preis zeigen «ECPE: –».
- Profil-Dialog und Drag & Drop funktionieren unverändert.
