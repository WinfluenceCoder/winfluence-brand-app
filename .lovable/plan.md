Scope: Footer in der App erhält für den Link "Über Winfluence" die URL https://winfluence.net/about.html. Die anderen Footer-Links (Impressum, Nutzungsbestimmungen, Datenschutzerklärung) bleiben vorerst Platzhalter (#).

Changes:
1. Update `src/components/app/AppFooter.tsx`
   - Extend the `links` array so each entry carries an `href` in addition to the translation key.
   - Set `href` to `https://winfluence.net/about.html` for the `footer.about` entry.
   - Keep the other three entries at `href: "#"`.
   - Use the `href` from the array for the `<a>` tag instead of the hardcoded `#`.
   - Optionally add `target="_blank"` and `rel="noopener noreferrer"` for the external about link to open safely in a new tab.

2. Verify
   - Check the footer in the preview to confirm "Über Winfluence" links to the correct external URL.

No backend, no schema, no Cloud changes needed.