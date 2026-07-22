## Ziel
Neues optionales Feld „Branche“ (`brands.industry`, Postgres-Enum, nullable) in `/profile` unter „Meine Brand“ direkt unter „Brand Name“.

## Änderungen

### 1. `src/locales/de.json`
- Neuer Block `"industry"` mit allen 20 Slugs (Reihenfolge wie in Vorgabe).
- Neue Keys:
  - `profile.brand.industry` → „Branche“
  - `profile.brand.industryPlaceholder` → „Branche auswählen“
  - `common.noSelection` → „Keine Angabe“ (falls noch nicht vorhanden)

### 2. Zod-Schema (in `src/routes/_authenticated/profile.tsx`)
Feld `industry: z.enum([...20 Slugs in fixer Reihenfolge]).nullable()` ergänzen. Konstante `INDUSTRY_OPTIONS: readonly string[]` einmalig oben in der Datei definieren und sowohl im Schema als auch im Rendern verwenden (keine alphabetische Sortierung).

### 3. Formular-Rendering
Direkt nach dem `brand_name`-Block (Zeile 449) einen neuen Block einfügen. Da die Sektion aktuell `Label` + `form.register` verwendet (kein FormField-Wrapper), wird Radix Select via `Controller` aus `react-hook-form` eingebunden — im gleichen `grid gap-2`-Layout wie die Nachbarfelder:

```tsx
<div className="grid gap-2">
  <Label htmlFor="industry">{t("profile.brand.industry")}</Label>
  <Controller
    control={form.control}
    name="industry"
    render={({ field }) => (
      <Select
        value={field.value ?? "none"}
        onValueChange={(v) => field.onChange(v === "none" ? null : v)}
      >
        <SelectTrigger id="industry">
          <SelectValue placeholder={t("profile.brand.industryPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("common.noSelection")}</SelectItem>
          {INDUSTRY_OPTIONS.map((slug) => (
            <SelectItem key={slug} value={slug}>{t(`industry.${slug}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  />
</div>
```

Imports ergänzen: `Controller` aus `react-hook-form`, `Select*` aus `@/components/ui/select` (falls noch nicht importiert).

### 4. Laden & Speichern
- `defaultValues` / Form-Reset erhält `industry: brand.industry ?? null` aus dem bestehenden Load-Flow.
- Beim Submit wird `values.industry` (bereits `string | null`) unverändert in das Update-Objekt für den bestehenden `updateMyBrand`-Mutationsflow übernommen.
- Sentinel `'none'` erscheint nie im Persist-Pfad (im `onValueChange` bereits zu `null` konvertiert).

## Nicht-Ziele
- Keine Datenbank-/Schema-Änderungen.
- Kein Lovable Cloud, kein `supabase--enable`.
- Keine Änderung an der Vollständigkeits-Berechnung/Green-Check-Logik der Brand-Sektion (Feld bleibt optional und beeinflusst `brandComplete` nicht).
