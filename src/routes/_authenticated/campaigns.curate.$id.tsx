import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { getMyCampaign } from "@/lib/campaigns.functions";
import { CampaignCard } from "@/components/app/CampaignCard";
import { CurationBoard } from "@/components/app/CurationBoard";
import { curationQueryOptions } from "@/lib/campaign-curation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/campaigns/curate/$id")({
  component: CurateCampaignPage,
});

function CurateCampaignPage() {
  const { id } = Route.useParams();
  const campaignId = Number(id);
  const router = useRouter();
  const { t } = useTranslation();
  const fetchCampaign = useServerFn(getMyCampaign);

  const { data } = useSuspenseQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => fetchCampaign({ data: { id: campaignId } }),
  });

  // `title` existiert in der DB, fehlt aber in den generierten Typen.
  const campaign = data as unknown as {
    title: string | null;
    briefing: string | null;
    campaign_visual_url: string | null;
    barter_value: number | null;
  } | null;

  const curation = useQuery(curationQueryOptions(campaignId));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("common.back")}
      </button>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("campaigns.curate.title")}
      </h1>

      {campaign ? (
        <CampaignCard
          campaign={{
            title: campaign.name ?? null,
            briefing: campaign.briefing,
            campaign_visual_url: campaign.campaign_visual_url,
          }}
        />
      ) : null}

      {curation.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("campaigns.curate.loading")}
          </CardContent>
        </Card>
      ) : curation.isError ? (
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm font-medium">
              {t("campaigns.curate.errorTitle")}
            </p>
            <p className="text-sm text-muted-foreground">
              {curation.error instanceof Error ? curation.error.message : ""}
            </p>
            <Button variant="outline" onClick={() => void curation.refetch()}>
              {t("campaigns.curate.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <CurationBoard
          campaignId={campaignId}
          collabs={curation.data ?? []}
          barterValue={campaign?.barter_value ?? null}
        />
      )}
    </div>
  );
}
