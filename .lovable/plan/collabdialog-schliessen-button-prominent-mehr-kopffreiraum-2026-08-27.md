# CollabDialog: Schliessen-Button prominent + mehr Kopffreiraum

## Ziel
Der Schliessen-Button (X) oben rechts im `CollabDialog` soll grösser, dauerhaft sichtbar und als Primary-Button formatiert werden. Die Inhalte (Avatar, Nickname usw.) erhalten mehr Abstand zum oberen Rand, damit der Button klar vom Inhalt getrennt ist.

## Bestandsaufnahme (geprüft)
- `src/components/ui/dialog.tsx`: `DialogContent` rendert automatisch `DialogPrimitive.Close` mit `absolute right-4 top-4 rounded-sm opacity-70` und X-Icon `h-4 w-4`. Diese Klasse ist fest im shared Component codiert.
- `cn()` in `src/lib/utils.ts` nutzt `twMerge`, so dass Konflikte wie `opacity-70` vs. `opacity-100` sauber vom späteren Wert überschrieben werden.
- `CollabDialog.tsx` nutzt `DialogContent` mit `max-h-[85vh] overflow-y-auto sm:max-w-2xl`; das `DialogHeader` ist `sr-only`, d. h. der erste sichtbare Block ist die Avatar-/Nickname-Zeile direkt unter dem Padding.
- Der Schliessen-Button unten im Footer (`Button variant="outline"`) bleibt unverändert.

## Umsetzung

### 1. `src/components/ui/dialog.tsx` — optionales `closeClassName`
`DialogContent` erhält einen optionalen Prop `closeClassName?: string`. Dieser wird per `cn(...)` in die `DialogPrimitive.Close`-Klasse gemerged. Default-Verhalten für alle anderen Dialoge bleibt identisch (kein Prop → bestehende Klassen).

```tsx
const DialogContent = React.forwardRef<...>(
  ({ className, children, closeClassName, ...props }, ref) => (
    ...
      <DialogPrimitive.Close className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 ... ",
        closeClassName,
      )}>
        <X className="h-4 w-4" />
        ...
      </DialogPrimitive.Close>
```

Das ist ein additiver, minimaler Eingriff am shared Component; nur Aufrufer, die `closeClassName` übergeben, ändern ihr Aussehen.

### 2. `src/components/app/CollabDialog.tsx` — Styling anwenden
An `DialogContent` werden zwei Anpassungen übergeben:

- **Mehr Kopffreiraum:** zusätzliches `pt-8` im `className` (Default `p-6` → oben `pt-8`, Seiten/Unten bleibt `p-6`).
- **Primary-Schliessen-Button:** `closeClassName` mit
  `bg-primary text-primary-foreground opacity-100 hover:opacity-100 rounded-md p-1.5 [&_svg]:h-5 [&_svg]:w-5`
  - `bg-primary text-primary-foreground` → Primary-Füllung.
  - `opacity-100 hover:opacity-100` → überschreibt `opacity-70`, permanent sichtbar.
  - `rounded-md p-1.5` → grössere Tapp-Fläche.
  - `[&_svg]:h-5 [&_svg]:w-5` → X-Icon von 16px auf 20px vergrössern.

```tsx
<DialogContent
  className="max-h-[85vh] overflow-y-auto pt-8 sm:max-w-2xl"
  closeClassName="bg-primary text-primary-foreground opacity-100 hover:opacity-100 rounded-md p-1.5 [&_svg]:h-5 [&_svg]:w-5"
>
```

## Nebenwirkungen
- Nur `CollabDialog.tsx` und die additive `closeClassName`-Option in `dialog.tsx` werden geändert.
- Alle anderen Dialoge behalten ihr bisheriges Aussehen (kein `closeClassName` übergeben).
- Keine Schema-, Query- oder i18n-Änderungen.
- Abschluss mit Typecheck (`tsgo`) und `bun run build`.
