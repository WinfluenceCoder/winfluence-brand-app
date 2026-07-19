## Problem
Logo und Icon werden über Lovable-CDN-Pointer (`/__l5e/assets-v1/…`) referenziert. Diese URLs funktionieren nur auf Lovable-Hosting, nicht auf Vercel → broken images.

## Lösung: Assets ins Repo zurückholen und lokal bundlen

### Schritte

1. **Beide Bild-Dateien lokal wiederherstellen**
   - `src/assets/winfluence-logo.png` (aus CDN herunterladen: `https://id-preview--40411584-0e5c-43bb-8c52-4427693f0d4a.lovable.app/__l5e/assets-v1/41391b62-ee51-4bf5-8e7a-0013efdb2f96/winfluence-logo.png`)
   - `src/assets/winfluence-icon.png` (aus CDN herunterladen: `https://id-preview--40411584-0e5c-43bb-8c52-4427693f0d4a.lovable.app/__l5e/assets-v1/3596a6ed-4a17-4dee-85f6-e6f1f14cfef0/winfluence-icon.png`)

2. **Pointer-Dateien entfernen**
   - `src/assets/winfluence-logo.png.asset.json` löschen
   - `src/assets/winfluence-icon.png.asset.json` löschen

3. **Imports auf klassisches Vite-Asset-Import umstellen** in
   - `src/components/app/AppSidebar.tsx`
   - allen weiteren Stellen, die aktuell die `.asset.json` importieren (nach kurzer Suche identifizieren)

   Muster:
   ```ts
   // vorher
   import logoAsset from "@/assets/winfluence-logo.png.asset.json";
   <img src={logoAsset.url} />

   // nachher
   import logoUrl from "@/assets/winfluence-logo.png";
   <img src={logoUrl} />
   ```
   Vite bundelt das Bild dann mit Hash in `dist/assets/…` – funktioniert auf Vercel out-of-the-box.

4. **Build verifizieren** (`bun run build`) und prüfen, dass die Bilder im `dist/`-Output landen.

### Optional (empfohlen, aber separat)
- `og:image`/`twitter:image` in `src/routes/__root.tsx` zeigen auf einen Lovable-Preview-Screenshot (`pub-….r2.dev/...`). Das lädt extern zwar auch von Vercel, ist aber kein Brand-Bild. Falls gewünscht, durch ein echtes, im Repo gebundeltes OG-Image (absolute HTTPS-URL nach Deploy) ersetzen – sag Bescheid, wenn ich das mitmachen soll.

### Was NICHT geändert wird
- Keine Backend-/Supabase-Änderungen
- `public/favicon.png` bleibt unverändert (liegt bereits im Repo → funktioniert auf Vercel)
- Keine Layout- oder Verhaltensänderung am Header/Sidebar

## Hinweis für die Zukunft
Solange du auf Vercel deployst, dürfen keine Lovable-CDN-Assets (`.asset.json`) verwendet werden. Bilder immer direkt in `src/assets/` oder `public/` ablegen.
