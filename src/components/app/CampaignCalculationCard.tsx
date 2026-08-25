import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatChf,
  formatNumberCh,
  type CurationCollab,
} from "@/lib/campaign-curation";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function CampaignCalculationCard({
  selected,
  barterValue,
}: {
  selected: CurationCollab[];
  barterValue: number | null;
}) {
  const { t } = useTranslation();
  const followers = selected.length * FOLLOWER_PLACEHOLDER;
  const cash = selected.reduce((sum, c) => sum + (c.price ?? 0), 0);
  const barter = selected.length * (barterValue ?? 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("campaigns.curate.calculation.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-x-10 gap-y-1 md:grid-cols-2">
        <div>
          <Metric
            label={t("campaigns.curate.calculation.followers")}
            value={formatNumberCh(followers)}
          />
          <Metric
            label={t("campaigns.curate.calculation.engagementRate")}
            value="12.4%"
          />
          <Metric
            label={t("campaigns.curate.calculation.matchingAudience")}
            value="88.7%"
          />
          <Metric
            label={t("campaigns.curate.calculation.matchingRegion")}
            value="92.2%"
          />
        </div>
        <div>
          <Metric
            label={t("campaigns.curate.calculation.costCash")}
            value={formatChf(cash)}
          />
          <Metric
            label={t("campaigns.curate.calculation.costBarter")}
            value={formatChf(barter)}
          />
          <Metric
            label={t("campaigns.curate.calculation.cpm")}
            value={formatChf(12.91)}
          />
          <Metric
            label={t("campaigns.curate.calculation.cpe")}
            value={formatChf(3.17)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
