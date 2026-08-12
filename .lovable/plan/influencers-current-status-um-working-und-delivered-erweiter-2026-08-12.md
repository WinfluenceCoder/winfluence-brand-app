# /influencers/current: Status um `working` und `delivered` erweitern

## Ziel
Die Liste `/influencers/current` soll neben `applied`, `selected`, `hired` auch Creator einbeziehen, deren `collabs.status` den Wert `working` oder `delivered` hat. In der Status-Spalte werden dafür passende Badges angezeigt.

## Änderungen

### 1. `src/lib/creators-list.ts`
`COLLAB_STATUSES` erweitern:
```ts
export const COLLAB_STATUSES = ["applied", "selected", "hired", "working", "delivered"] as const;
```
Das steuert gleichzeitig das Status-Filter-Dropdown in `CreatorsTable` (alle Werte erscheinen als Option).

### 2. `src/routes/_authenticated/influencers.current.tsx`
Loader-Prefetch und `statuses`-Prop ergänzen:
```ts
status: ["applied", "selected", "hired", "working", "delivered"]
```

### 3. `src/components/app/CreatorsTable.tsx`
- `creatorStatusLabel`: Cases für `working` → `creatorsList.status.working` und `delivered` → `creatorsList.status.delivered` ergänzen.
- `statusVariant`: `working` als `default` (aktive Kampagne) und `delivered` als `outline` (abgeschlossen) abbilden, damit die Badges visuell unterscheidbar bleiben. Bestehende Werte (`hired` → default, sonst `secondary`) bleiben erhalten.

### 4. `src/locales/de.json`
Unter `creatorsList.status` ergänzen:
```json
"working": "In Arbeit",
"delivered": "Geliefert"
```

## Nebenwirkungen
- Das Status-Filter-Dropdown auf `/influencers/current` zeigt zwei weitere Optionen. Die Listen `/influencers/applied` und `/influencers/hired` bleiben unberührt (eigene Status-Arrays).
- Keine Schema- oder RLS-Änderung erforderlich; die neuen Status-Werte müssen in der `collabs.status`-Spalte bereits erlaubt sein (CHECK-Constraint/Enum prüfen, falls vorhanden).
