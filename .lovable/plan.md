Auf der `/login`-Seite soll unterhalb des Passwort-Eingabefeldes eine Checkbox "Passwort anzeigen" ergänzt werden. Beim Aktivieren wird das Passwort im Klartext angezeigt, beim Deaktivieren wieder maskiert.

Geplante Änderungen:

1. **Lokalisierung** (`src/locales/de.json`)
   - Neuen Schlüssel `auth.showPassword` mit dem Text "Passwort anzeigen" hinzufügen.

2. **Login-Formular** (`src/routes/login.tsx`)
   - React-State `showPassword` (boolean, initial `false`) im `LoginPage`-Komponenten einführen.
   - Die Checkbox aus `src/components/ui/checkbox.tsx` importieren.
   - Das Passwort-Input-Feld im Login-Formular dynamisch zwischen `type="password"` und `type="text"` umschalten, abhängig von `showPassword`.
   - Die Checkbox direkt unterhalb des Passwort-Feldes (innerhalb desselben `grid gap-2`-Blocks, unter dem Fehlertext) platzieren und mit dem Label "Passwort anzeigen" versehen.
   - Checkbox und Label mit `htmlFor`/`id` verknüpfen.

Optional (falls gewünscht): Dieselbe Logik kann auch für das Passwortfeld im Registrierungsformular auf der selben Seite übernommen werden.

Technische Details:
- Verwendet bestehende UI-Komponenten: `Input`, `Label`, `Checkbox`.
- Keine Backend- oder Auth-Logik wird geändert; reiner Frontend-UI-Change.
- Nach der Änderung wird ein Typecheck (`tsgo`) ausgeführt.