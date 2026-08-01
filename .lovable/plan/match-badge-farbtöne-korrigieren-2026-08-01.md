# Match-Badge Farbtöne korrigieren

## Ursache (verifiziert)

Die Farbwerte `--match-green-1..5` / `--match-gray-1..5` stehen in `src/styles.css` ausschliesslich im `.dark`-Block (Zeilen 137–150). Im hellen Modus sind diese Variablen nicht definiert, `background-color: var(--match-green-3)` ist damit ungültig und wird verworfen — der Badge behält die Standardfarbe der Badge-Komponente (`bg-primary`).

Zweitens setzt die Badge-Variante `default` zusätzlich `bg-primary text-primary-foreground hover:bg-primary/80`; der Hover-Zustand überschreibt die Match-Farbe auch dann, wenn die Variablen greifen.

## Änderungen

1. `src/styles.css`
   - Die zehn Match-Farbtokens plus die vier Vordergrund-Tokens aus dem `.dark`-Block nach `:root` verschieben (Basis = helles Theme).
   - Im `.dark`-Block nur noch die Abweichungen belassen, die für Dunkelmodus-Kontrast nötig sind (etwas hellere Grüntöne, hellere Graustufen).

2. `src/components/app/CreatorMiniCard.tsx`
   - Badge mit `variant="outline"` rendern (setzt keine eigene Hintergrundfarbe und kein Hover-Background), zusätzlich `border-transparent`, damit ausschliesslich die `match-*`-Utility die Farbe bestimmt.

Keine Logikänderung: Schwellenwerte und Prozentformatierung in `src/lib/campaign-curation.ts` bleiben unverändert.

## Prüfung

Nach der Änderung `/campaigns/curate/6` im Preview öffnen und die berechneten Hintergrundfarben der Badges auslesen, um abgestufte Grün- bzw. Grautöne zu bestätigen.
