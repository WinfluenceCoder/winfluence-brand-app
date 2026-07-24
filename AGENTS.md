<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Kampagnen-Workflow

Der status-abhängige Kampagnen-Workflow (Zeilen-Klick, Next-Step-Spalte, Kontextmenü in `src/components/app/CampaignsTable.tsx`) ist in [`docs/campaign-workflow.md`](docs/campaign-workflow.md) dokumentiert und in `src/lib/campaign-workflow.ts` als Code-Konfiguration abgebildet. **Bei jeder Änderung an diesem Workflow beide Dateien synchron halten.**
