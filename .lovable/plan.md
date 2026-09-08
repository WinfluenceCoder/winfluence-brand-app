# Sidebar-Logo grösser und zentriert

## Ziel
- **Ausgeklappt:** Logo deutlich grösser und horizontal zentriert über dem Sidebar-Nav.
- **Eingeklappt:** Icon grösser, sauber im 48px-Spalten-Icon-Modus zentriert.

## Kontext
- Sidebar-Breite: 16rem (256px) ausgeklappt, 3rem (48px) eingeklappt (`sidebar.tsx`).
- Logo `winfluence-logo.png`: 1790×449, Aspect ~4:1.
- Icon `winfluence-icon.png`: 676×676, quadratisch.
- `AppSidebar.tsx` nutzt bereits `collapsed` (aus `useSidebar`).

## Änderung (nur `src/components/app/AppSidebar.tsx`)

`SidebarHeader` + Logo/Icon-Img-Klassen anpassen, abhängig von `collapsed`:

```tsx
<SidebarHeader
  className={
    collapsed
      ? "h-14 px-0 flex items-center justify-center"
      : "h-16 px-4 pt-4 flex items-start justify-center"
  }
>
  <Link to="/" className="flex items-center justify-center">
    {collapsed ? (
      <img
        src={icon}
        alt="winfluence"
        className="h-10 w-10 object-contain rounded-sm"
      />
    ) : (
      <img
        src={logo}
        alt="winfluence"
        className="h-10 w-auto object-contain"
      />
    )}
  </Link>
</SidebarHeader>
```

### Werte
- **Ausgeklappt:** Logo `h-10` (40px → ~159px breit bei Aspect 4:1, passt in 224px nutzbare Breite). Header `h-16` (64px), `justify-center` zentriert horizontal, `pt-4` setzt es oben mit Luft. `items-start` damit das Logo oben sitzt.
- **Eingeklappt:** Icon `h-10 w-10` (40px) statt `h-8 w-8` (32px). Header `px-0` (statt `px-4`), damit die 40px in die 48px schmale Icon-Spalte passen; `items-center justify-center` zentriert es.

## Nicht angefasst
- Keine Backend-, Schema- oder Layout-Änderungen ausser diesem Header.
- Keine neuen Dependencies.
- `sidebar.tsx` und Asset-Dateien bleiben unangetastet.

## Verifikation
- Build/Typecheck (`bun run build`).
- Visuell im Preview: ausgeklappt = Logo grösser und mittig über dem Nav; eingeklappt = Icon grösser und zentriert in der schmalen Spalte, kein Überlauf.
