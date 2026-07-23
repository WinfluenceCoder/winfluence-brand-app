import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/campaigns/publish/$id")({
  component: PublishCampaignPage,
});

function PublishCampaignPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Zurück
      </button>
      <h1 className="text-2xl font-semibold tracking-tight">
        Kampagne publizieren
      </h1>
      <p className="text-sm text-muted-foreground">
        Inhalt folgt. (Kampagne #{id})
      </p>
    </div>
  );
}
