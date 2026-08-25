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

  const { followers, engagementRate, cash, barter, cpm, cpe } = useMemo(() => {
    const rows = selected.map((c) => ({
      followers: c.creator.instagram_followers,
      rate: c.creator.instagram_engagement_rate,
      price: c.price ?? 0,
    }));

    const followers = rows.reduce((s, r) => s + (r.followers ?? 0), 0);

    const weighted = rows.filter((r) => r.followers != null && r.rate != null);
    const weightSum = weighted.reduce((s, r) => s + r.followers!, 0);
    const engagementRate =
      weightSum > 0
        ? weighted.reduce((s, r) => s + r.followers! * r.rate!, 0) / weightSum
        : null;

    const cash = rows.reduce((s, r) => s + r.price, 0);
    const barter = selected.length * (barterValue ?? 0);

    const cpm = followers > 0 ? (cash / followers) * 1000 : null;
    const engagements =
      engagementRate != null ? followers * (engagementRate / 100) : null;
    const cpe = engagements && engagements > 0 ? cash / engagements : null;

    return { followers, engagementRate, cash, barter, cpm, cpe };
  }, [selected, barterValue]);

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
            value={engagementRate != null ? `${engagementRate.toFixed(1)}%` : "–"}
          />
          <Metric
            label={t("campaigns.curate.calculation.matchingAudience")}
            value="n/a"
          />
          <Metric
            label={t("campaigns.curate.calculation.matchingRegion")}
            value="n/a"
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
            value={cpm != null ? formatChf(cpm) : "–"}
          />
          <Metric
            label={t("campaigns.curate.calculation.cpe")}
            value={cpe != null ? formatChf(cpe) : "–"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
