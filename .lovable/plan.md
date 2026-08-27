# CollabDialog: Mehr Kopffreiraum — Schliessen-Button vom Inhalt trennen

## Problem
`CollabDialog` nutzt aktuell `pt-8` (32px) oben. Der vergrösserte Primary-Schliessen-Button
beginnt bei `top-4` (16px) und ist mit `p-1.5` + 20px-Icon ca. 32px hoch, reicht also bis ~48px
vom oberen Rand. Die Inhalte (Avatar, Nickname) starten bei 32px und überlappen deshalb den
Button visuell — keine klare Trennung.

## Umsetzung (minimaler Diff)
`src/components/app/CollabDialog.tsx`, Zeile 401: `pt-8` → `pt-14` (56px).

Damit starten die Inhalte klar unterhalb des Buttons (~48px) mit ~8px Abstand. Seiten-/Unten-
Padding bleibt durch die Default-Klasse `p-6` von `DialogContent` erhalten. Keine andere Datei
wird geändert; `dialog.tsx`, Übersetzungen, Schema und Queries bleiben unberührt.

```tsx
<DialogContent
  className="max-h-[85vh] overflow-y-auto pt-14 sm:max-w-2xl"
  closeClassName="bg-primary text-primary-foreground opacity-100 hover:opacity-100 rounded-md p-1.5 [&_svg]:h-5 [&_svg]:w-5"
>
```

## Nebenwirkungen
- Nur eine Klasse in einer Datei; alle anderen Dialoge und Routen unverändert.
- Keine Schema-, Query- oder i18n-Änderung.
- Abschluss mit Typecheck (`tsgo`) und `bun run build`.
