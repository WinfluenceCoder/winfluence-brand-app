import { useTranslation } from "react-i18next";
import { Megaphone, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type CampaignCardData = {
  title: string | null;
  briefing: string | null;
  campaign_visual_url: string | null;
};

export function CampaignCard({
  campaign,
  id,
  status,
}: {
  campaign: CampaignCardData;
  id: number;
  status: string | null;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{t("campaignPublish.sections.campaign")}</CardTitle>
        {status !== "draft" && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={`/campaigns/preview/${id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("campaignForm.viewLive")}
            </a>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="w-full shrink-0 sm:w-56">
            {campaign.campaign_visual_url ? (
              <img
                src={campaign.campaign_visual_url}
                alt=""
                className="aspect-square w-full rounded-md object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-md bg-muted">
                <Megaphone className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              {campaign.title ?? "–"}
            </h2>
            {campaign.briefing && (
              <p className="line-clamp-9 whitespace-pre-wrap text-sm text-muted-foreground">
                {campaign.briefing}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
