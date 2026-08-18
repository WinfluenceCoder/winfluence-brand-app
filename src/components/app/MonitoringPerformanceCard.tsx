import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function MonitoringPerformanceCard() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("campaigns.monitor.performance.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-x-10 gap-y-1 md:grid-cols-2">
        <div>
          <Metric
            label={t("campaigns.monitor.performance.impressions")}
            value="128'450"
          />
          <Metric label={t("campaigns.monitor.performance.reach")} value="94'210" />
          <Metric
            label={t("campaigns.monitor.performance.engagementRate")}
            value="12.4%"
          />
          <Metric label={t("campaigns.monitor.performance.clicks")} value="3'812" />
        </div>
        <div>
          <Metric label={t("campaigns.monitor.performance.cpm")} value="CHF 12.91" />
          <Metric label={t("campaigns.monitor.performance.cpe")} value="CHF 3.17" />
          <Metric
            label={t("campaigns.monitor.performance.costCash")}
            value="CHF 4'500.00"
          />
          <Metric
            label={t("campaigns.monitor.performance.costBarter")}
            value="CHF 1'200.00"
          />
        </div>
      </CardContent>
    </Card>
  );
}
