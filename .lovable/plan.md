# Winfluence-Logo, -Icon und Favicon ersetzen

## Ziel
Neues Branding übernehmen: Logo, Sidebar-Icon und Favicon werden durch die hochgeladenen Dateien ersetzt.

## Änderungen

1. **Logo**: `user-uploads://logo.png` ersetzt `src/assets/winfluence-logo.png` (gleicher Dateiname, bestehende Imports bleiben). Zeigt danach automatisch überall das neue Logo:
   - Sidebar (`AppSidebar.tsx`)
   - `/login`, `/welcome`, `/reset-password`, `/set-password`, `/signed-out`
   - Öffentliche Kampagnen-Preview (`/campaigns/preview/$id`)
2. **Sidebar-Icon (zugeklappt)**: `user-uploads://favicon_brand.png` (Spark-Symbol) ersetzt `src/assets/winfluence-icon.png`.
3. **Favicon**: Aus `favicon_brand.png` wird eine quadratische 64×64-Version als `public/favicon.png` erzeugt; der Root-Head (`src/routes/__root.tsx`) verweist darauf; das alte Template-`favicon.ico` wird entfernt, falls noch vorhanden.

## Nicht angefasst

- Keine Code-Struktur-, Backend- oder Layout-Änderungen — nur Asset-Dateien und der Favicon-Link im Root-Head.
