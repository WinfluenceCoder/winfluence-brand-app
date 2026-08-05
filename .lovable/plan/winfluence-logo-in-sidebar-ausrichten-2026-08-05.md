Winfluence Logo in Sidebar ausrichten

Ziel: Das Logo/Icon im Sidebar-Header linkbündig ausrichten und den oberen Abstand so anpassen, dass es optisch vertikal zur Header-Zeile (h-14) zentriert wirkt.

Schritte:

1. In `src/components/app/AppSidebar.tsx` den `SidebarHeader` anpassen:
   - Sicherstellen, dass das Logo/Icon linkbündig sitzt (bereits `justify-start`).
   - Oberen Abstand erhöhen, z.B. durch `pt-5` oder `mt-2` auf dem Header oder dem Link, um das Logo optisch vertikal gegenüber der Header-Zeile zu zentrieren.
   - Optional die Header-Höhe flexibel gestalten (`items-start` statt `items-center` mit zusätzlichem Top-Padding), damit das Verschieben nach unten möglich ist, ohne das Layout zu sprengen.

2. Prüfen, ob der `Link` rund um das Logo ebenfalls linkbündig bleibt und keine ungewollten Margins/Paddings erzeugt.

3. Keine anderen Dateien anfassen. Keine Cloud-, Backend- oder Schema-Änderungen.

4. Nach dem Build visuell verifizieren: Logo sitzt linksbündig und wirkt in der vertikalen Mitte zur Header-Zeile.
