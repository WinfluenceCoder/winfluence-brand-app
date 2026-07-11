## /profile Formular erweitern

### 1. Status-Badge (oben)
- Neuer Bereich direkt unter der Seitenüberschrift: `Status: <Badge>` (nur Anzeige, read-only).
- Wert aus `brand.status`. Badge-Variante je nach Wert (Fallback `secondary`).
- i18n-Key `profile.status` in `de.json`.

### 2. Abschnitt „Meine Firma" (umbenannt von „Firma")
- `profile.companySection` → „Meine Firma".
- Neue Felder unter den bestehenden Firma-Feldern (nach `insta_url`):
  - `billing_address_to` (Text, optional)
  - `billing_address_street` (Text, optional)
  - `billing_address_nr` (Integer, optional) — number input
  - `billing_address_zip` (Integer, optional) — number input
  - `billing_address_city` (Text, optional)
- Layout: `street`+`nr` in einer 2-Spalten-Row (2/1), `zip`+`city` in einer 2-Spalten-Row (1/2).

### 3. Neuer Abschnitt „Meine Brand" (zwischen Firma und Ansprechperson)
- Neuer i18n-Key `profile.brandSection` = „Meine Brand".
- Felder:
  - `brand_name` (Text)
  - `brand_pitch` (Textarea, „Elevator Pitch")
  - `hashtags` (Text, Label „Keywords")
  - `linkedin_url` (URL, „LinkedIn Profil Brand") — Validierung `http(s)://…`
  - `youtube_url` (URL, „Youtube Channel der Brand") — Validierung `http(s)://…`
  - `tiktok_url` (URL, „Tiktok Brand") — Validierung `http(s)://…`

### 4. Server-Function & Schema
- `updateSchema` in `src/lib/brands.functions.ts` erweitern um alle neuen Felder (mit passenden Zod-Typen; Integers via `z.coerce.number().int().nullable().optional()`; URLs mit gleichem Regex wie `user_linkedin_url`).
- `updateMyBrand.handler` schreibt die neuen Felder unverändert in den Update-Patch.
- `status` wird **nicht** über das Formular geschrieben (read-only).

### 5. Frontend-Verdrahtung
- Zod-Formular-Schema in `profile.tsx` um neue Felder erweitern (analog bestehende Muster inkl. Fehleranzeige unter dem Feld + `border-destructive`).
- `defaultValues` aus `brand` befüllen; leere Strings → `null` beim Submit; Zahlen sauber konvertieren.
- Textarea-Komponente (`@/components/ui/textarea`) für `brand_pitch`.
- `brand_name` nicht mehr fest aus `brand?.brand_name` beim Submit übernehmen, sondern aus Formfeld.

### 6. i18n (`src/locales/de.json`)
Neue Keys unter `profile`:
- `status`, `brandSection`, `billingTo`, `billingStreet`, `billingNr`, `billingZip`, `billingCity`, `brandName`, `brandPitch`, `keywords`, `brandLinkedin`, `brandYoutube`, `brandTiktok`.
- `companySection` → „Meine Firma".

Keine DB-Migration nötig (alle Spalten existieren bereits).