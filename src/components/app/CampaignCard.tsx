import { useTranslation } from "react-i18next";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type CampaignCardData = {
  title: string | null;
  briefing: string | null;
  campaign_visual_url: string | null;
};

export function CampaignCard({ campaign }: { campaign: CampaignCardData }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("campaignPublish.sections.campaign")}</CardTitle>
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
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {campaign.briefing}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
