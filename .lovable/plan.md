# Match-Badge auf der Creator-Karte (/campaigns/curate/$id)

## Ziel

Unter dem Creator-Foto in der Creator-Karte erscheint ein Badge mit dem Match-Wert aus `collabs.match`, farblich abgestuft.

## Anzeige

- Wert wird als Prozent mit einer Dezimalstelle dargestellt: `0.765` -> `76.5%` (CH-Formatierung, z. B. `76.5%`).
- Kein Badge, wenn `match` leer (`null`) ist.
- Position: direkt unterhalb des Avatars in der linken Spalte der Karte, zentriert unter dem Bild, kompakte Badge-Größe.

## Farbabstufung

Fünf Stufen je Richtung, damit „je höher desto dunkler grün“ / „je kleiner desto dunkler grau“ sichtbar wird:

```text
>= 0.90   sehr dunkles Grün
>= 0.75   dunkles Grün
>= 0.65   mittleres Grün
>= 0.55   helles Grün
>= 0.50   sehr helles Grün

<  0.50   helles Grau
<  0.40   mittleres Grau
<  0.30   dunkleres Grau
<  0.20   dunkles Grau
<  0.10   sehr dunkles Grau
```

Textfarbe wird je Stufe passend gesetzt (dunkle Flächen = helle Schrift), damit der Wert lesbar bleibt.

## Technische Details

- `src/lib/campaign-curation.ts`: neue Helfer `formatMatchPercent(value)` (Prozent mit 1 Dezimalstelle) und `matchBadgeClasses(value)` (liefert die Tailwind-Klassen der jeweiligen Stufe).
- `src/components/app/CreatorMiniCard.tsx`: Avatar-Bereich wird zu einer vertikalen Spalte (Avatar + Badge darunter); Badge über die shadcn-`Badge`-Komponente mit den Klassen aus dem Helfer.
- Grün-/Grau-Stufen werden als Design-Token-Utilities im Theme (`src/styles.css`) ergänzt, damit keine harten Farbwerte in der Komponente stehen und Dark Mode funktioniert.
- Keine Schema-Änderungen, keine Änderung der Datenabfrage (`match` wird bereits geladen).
