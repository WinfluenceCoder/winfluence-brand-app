# Profil verbergen: Schalter auf der Status-Zeile

## Ziel

Auf `/profile` wird auf derselben Zeile wie «Status» rechtsbündig das Label «Profil verbergen» mit einem On/Off-Schalter angezeigt. Der Schalter spiegelt den Wert `brands.is_stealth` und schreibt Änderungen direkt zurück.

## Verhalten

- Zeile: links `Status: <Badge>`, rechts (rechtsbündig) `Profil verbergen` + Switch.
- Initialwert kommt aus dem geladenen Brand-Datensatz (`is_stealth`, leer/`null` = aus).
- Umschalten speichert sofort (kein «Speichern»-Klick nötig): optimistisches Update, Erfolg still, bei Fehler Toast und Rücksprung auf den alten Wert.

## Umsetzung (technisch)

- `src/lib/brands.functions.ts`: neue Server-Funktion `setMyBrandStealth` (POST, `requireSupabaseAuth`, Zod `{ is_stealth: boolean }`), Update auf `brands` gefiltert nach `user_id`. Keine Änderung an `updateMyBrand`.
- `src/routes/_authenticated/profile.tsx`: shadcn `Switch` in der Status-Zeile (`flex items-center justify-between`), lokaler State + `useMutation`, danach Invalidierung der Brand-Query.
- `src/locales/de.json`: neuer Key `profile.hideProfile` = «Profil verbergen».
- Keine Schema-Änderungen; `is_stealth` fehlt in den generierten Typen, daher ein enger Cast an der Update-/Lesestelle (wie bereits bei `banner_url`/`industry`).

## Voraussetzung

Die Spalte `brands.is_stealth` muss im verbundenen Supabase-Projekt existieren und per UPDATE-Policy für den eigenen Datensatz beschreibbar sein (nicht durch mich verifiziert). Falls nicht vorhanden, liefere ich ein SQL-Snippet unter `.lovable/`.
