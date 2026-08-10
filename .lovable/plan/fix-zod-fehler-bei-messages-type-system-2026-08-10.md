# Fix: Zod-Fehler bei /messages?type=system

## Ursache (bestätigt)

Die angezeigte Meldung ist kein Datenbank-Fehler mehr, sondern ein Validierungsfehler der URL-Parameter:

```text
[{ "code": "invalid_type", "expected": "nonoptional", "path": ["id"], "message": "Invalid input" }]
```

In `src/routes/_authenticated/messages.index.tsx` ist der Suchparameter so definiert:

```ts
id: fallback(z.number().optional(), undefined)
```

`fallback(...)` erwartet ein Schema mit nicht-optionalem Wert; kombiniert mit `.optional()` erzeugt es in Zod 4 genau diesen `expected: "nonoptional"`-Fehler, sobald `id` in der URL fehlt (also z. B. bei `/messages?type=system`).

## Fix

- `validateSearch` der Nachrichten-Route ohne `fallback()` für `id` aufbauen:
  - `type`: `z.string()` mit Default `"all"` (bleibt tolerant, unbekannte Werte fallen im Code weiter auf "Alle" zurück).
  - `id`: optionale, tolerante Zahl — nicht vorhandene oder unbrauchbare Werte ergeben `undefined` statt eines Fehlers (Umwandlung von String zu Zahl, ungültig → `undefined`).
- Damit lädt `/messages`, `/messages?type=system`, `/messages?type=user`, `/messages?type=moderator` sowie `/messages?type=system&id=123` fehlerfrei.
- Die bereits ergänzte Fehlergrenze und die Inline-Fehleranzeige bleiben bestehen (nur der Auslöser verschwindet).

## Prüfung danach

- Alle vier Tabs sowie ein Direktlink mit `id` aufrufen und bestätigen, dass keine Fehlermeldung mehr erscheint.
- Falls dann ein Datenbank-Fehler sichtbar wird (z. B. das zuvor gefundene `permission denied for function has_role`), meldet die Seite ihn im Klartext — dieser Teil wird ausschliesslich in der externen Datenbank per SQL gelöst, ohne Code-Änderung.

## Technische Details

- Betroffene Datei: `src/routes/_authenticated/messages.index.tsx` (nur das Such-Schema).
- Keine Schema-Änderungen, keine Migrationen, kein Lovable Cloud; Abschluss mit Typecheck.
