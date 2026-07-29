## Ziel
Im Brand-/Profilformular (`src/routes/_authenticated/profile.tsx` – dort liegt das Brand-Formular) Domain-Validierung und automatische Mobilnummer-Formatierung ergänzen. Nur Frontend, keine Schema- oder Backend-Änderung.

## 1. Domain
- Bleibt Pflichtfeld (`validation.required` wie bisher).
- Zusätzliche Formatprüfung: Labels aus a–z/0–9/Bindestrich, mindestens ein Punkt, TLD ≥ 2 Zeichen (`winfluence.net`, `sub.brand.co.uk` gültig).
- Neue Hilfsfunktion `normalizeDomain(v)`: entfernt führendes `http://`/`https://`, ein `www.`-Präfix und einen abschliessenden `/`, wandelt in Kleinschreibung und trimmt.
- Beim Verlassen des Feldes (`onBlur`) wird der normalisierte Wert via `form.setValue("domain", ..., { shouldValidate: true, shouldDirty: true })` zurückgeschrieben, sodass die reine Domain gespeichert wird.
- Neuer i18n-Key `validation.domain` in `src/locales/de.json`: „Ungültige Domain (z. B. brand.ch)".

## 2. Mobile
- Bleibt optional.
- Neue Hilfsfunktion `formatChMobile(v)`: erkennt CH-Nummern mit Präfix `0`, `+41` oder `0041` und normalisiert auf `+41 79 123 45 67`.
- `onBlur` schreibt den formatierten Wert via `form.setValue("mobile", ..., { shouldValidate: true, shouldDirty: true })` zurück; ist die Nummer ungültig, bleibt die Eingabe unverändert und `validation.mobileCH` erscheint.
- Bestehender `chMobileRegex` wird leicht erweitert, sodass auch `0041`-Nummern akzeptiert werden.

## Technische Details
- Beide Felder registrieren einen eigenen `onBlur`, der zuerst den von `form.register(...)` gelieferten `onBlur` aufruft und danach normalisiert/formatiert.
- Hilfsfunktionen als Modul-Level-Funktionen oben in der Datei.
- Zod-Schema-Anpassung nur für `domain` (zusätzliches `.refine`) und `mobile` (erweiterter Regex).
