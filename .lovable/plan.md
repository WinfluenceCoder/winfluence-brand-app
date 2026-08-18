# Influencer-Listen: Badge-Farben für `hired` und `working`

## Ziel
In `CreatorsTable` (gilt für alle Influencer-Listen, insbesondere `/influencers/hired`) die Status-Badges farblich absetzen:
- `hired` → dezentes Orange
- `working` → dezentes Grün

`applied`/`selected` bleiben wie bisher (`secondary`), `delivered` bleibt `outline`. Sonst nichts ändern.

## Änderungen

### 1. `src/components/ui/badge.tsx`
Zwei neue Varianten in `badgeVariants` ergänzen (mit Dark-Mode-Varianten, dezente Tönung = heller Hintergrund + dunkle Schrift + farbiger Rand):
- `hired`: Orange — z. B. `border-orange-300/50 bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-800/40`
- `working`: Grün — z. B. `border-green-300/50 bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200 dark:border-green-800/40`

### 2. `src/components/app/CreatorsTable.tsx`
`statusVariant()` anpassen:
- `case "hired": return "hired";`
- `case "working": return "working";`
(der Rückgabetyp wird um die beiden neuen Varianten ergänzt; `delivered` → `outline`, Default → `secondary` bleibt).

## Nebenwirkungen
- Da `CreatorsTable` auf `/influencers/current`, `/influencers/applied` und `/influencers/hired` gemeinsam genutzt wird, erscheinen die neuen Farben auf allen drei Listen. Das ist gewollt (`hired`/`working`-Status konsistent darstellen).
- Keine Schema-, RLS- oder Übersetzungsänderung.
