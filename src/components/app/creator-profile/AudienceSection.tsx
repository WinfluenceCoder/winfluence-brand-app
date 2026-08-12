import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { asPercent, formatNumber, formatPercent, formatRelativeDate } from "@/lib/format";
import type {
  AudienceAnalysis,
  CreatorSocialStats,
} from "@/lib/creator-stats";
import {
  BarList,
  ChipCloud,
  Gauge,
  KpiCard,
  PersonGrid,
  Section,
} from "./primitives";

function pct(v: number | null | undefined): number {
  return asPercent(v ?? null) ?? 0;
}

function AudienceBlocks({
  analysis,
  compact,
}: {
  analysis: AudienceAnalysis;
  compact?: boolean;
}) {
  const { t } = useTranslation();

  const ageData = useMemo(
    () =>
      (analysis?.averageBirthyearArray ?? [])
        .filter((a) => a?.birthyear != null)
        .map((a) => ({
          year: String(a.birthyear),
          male: pct(a.valueMale),
          female: pct(a.valueFemale),
        }))
        .sort((a, b) => Number(a.year) - Number(b.year)),
    [analysis],
  );

  const genderData = useMemo(() => {
    const male = pct(analysis?.genderMtoF?.male);
    const female = pct(analysis?.genderMtoF?.female);
    if (male === 0 && female === 0) return [];
    return [
      { name: t("creatorProfile.audience.male"), value: male },
      { name: t("creatorProfile.audience.female"), value: female },
    ];
  }, [analysis, t]);

  const countries = (analysis?.countryArray ?? [])
    .filter((c) => c?.country)
    .map((c) => ({ label: String(c.country), value: pct(c.value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  const cities = (analysis?.cityArray ?? [])
    .filter((c) => c?.city)
    .map((c) => ({ label: String(c.city), value: pct(c.value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  const languages = (analysis?.languageArray ?? [])
    .filter((l) => l?.language)
    .map((l) => ({ label: String(l.language), value: pct(l.value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  const states = (analysis?.stateArray ?? [])
    .filter((s) => s?.state)
    .map((s) => ({ label: String(s.state), value: pct(s.value) }))
    .sort((a, b) => b.value - a.value);
  const interests = (analysis?.audienceInterests ?? [])
    .filter((i) => i?.name)
    .map((i) => ({ label: String(i.name), weight: i.weight ?? 0 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 15);
  const brands = (analysis?.brandAffinity ?? [])
    .filter((b) => b?.name)
    .map((b) => ({ label: String(b.name), weight: b.weight ?? 0 }))
    .sort((a, b) => b.weight - a.weight);
  const reachability = (analysis?.reachabilityBuckets ?? [])
    .filter((r) => r?.code)
    .map((r) => ({ label: String(r.code), value: pct(r.weight) }));

  return (
    <div className="space-y-8">
      {analysis?.audienceType ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label={t("creatorProfile.audience.realPeople")}
            value={formatPercent(pct(analysis.audienceType.realPeoplePercentage))}
          />
          <KpiCard
            label={t("creatorProfile.audience.massFollowers")}
            value={formatPercent(
              pct(analysis.audienceType.massFollowersPercentage),
            )}
          />
          <KpiCard
            label={t("creatorProfile.audience.suspicious")}
            value={formatPercent(pct(analysis.audienceType.suspiciousPercentage))}
          />
        </div>
      ) : null}

      {ageData.length > 0 || genderData.length > 0 ? (
        <Section title={t("creatorProfile.audience.demographics")}>
          <div className="grid gap-4 lg:grid-cols-3">
            {ageData.length > 0 ? (
              <Card className="lg:col-span-2">
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={compact ? 180 : 240}>
                    <BarChart data={ageData}>
                      <XAxis dataKey="year" fontSize={11} tickLine={false} />
                      <YAxis fontSize={11} tickLine={false} width={30} />
                      <ChartTooltip
                        formatter={(v: number) => formatPercent(v)}
                      />
                      <Bar
                        dataKey="female"
                        stackId="a"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.5}
                      />
                      <Bar dataKey="male" stackId="a" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                  {analysis?.birthyearMedian != null ? (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {t("creatorProfile.audience.medianBirthyear")}:{" "}
                      {analysis.birthyearMedian}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
            {genderData.length > 0 ? (
              <Card>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={compact ? 180 : 240}>
                    <PieChart>
                      <Pie
                        data={genderData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="80%"
                      >
                        {genderData.map((_, i) => (
                          <Cell
                            key={i}
                            fill="hsl(var(--primary))"
                            fillOpacity={i === 0 ? 1 : 0.45}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(v: number) => formatPercent(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-1 text-center text-xs text-muted-foreground">
                    {genderData
                      .map((g) => `${g.name} ${formatPercent(g.value)}`)
                      .join(" · ")}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </Section>
      ) : null}

      {countries.length > 0 || cities.length > 0 || languages.length > 0 ? (
        <Section title={t("creatorProfile.audience.geography")}>
          <div className="grid gap-4 lg:grid-cols-3">
            {countries.length > 0 ? (
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="text-xs text-muted-foreground">
                    {t("creatorProfile.audience.countries")}
                  </div>
                  <BarList items={countries} />
                </CardContent>
              </Card>
            ) : null}
            {cities.length > 0 ? (
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="text-xs text-muted-foreground">
                    {t("creatorProfile.audience.cities")}
                  </div>
                  <BarList items={cities} />
                </CardContent>
              </Card>
            ) : null}
            {languages.length > 0 ? (
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="text-xs text-muted-foreground">
                    {t("creatorProfile.audience.languages")}
                  </div>
                  <BarList items={languages} />
                </CardContent>
              </Card>
            ) : null}
          </div>
          {states.length > 0 ? (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {t("creatorProfile.audience.states")}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <Card>
                  <CardContent className="p-4">
                    <BarList items={states} />
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </Section>
      ) : null}

      {interests.length > 0 || brands.length > 0 ? (
        <Section title={t("creatorProfile.audience.interests")}>
          <div className="space-y-4">
            {interests.length > 0 ? (
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="text-xs text-muted-foreground">
                    {t("creatorProfile.audience.interestsLabel")}
                  </div>
                  <ChipCloud items={interests} />
                </CardContent>
              </Card>
            ) : null}
            {brands.length > 0 ? (
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="text-xs text-muted-foreground">
                    {t("creatorProfile.audience.brandAffinity")}
                  </div>
                  <ChipCloud items={brands.slice(0, 20)} />
                  {brands.length > 20 ? (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {t("creatorProfile.showAll")}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3">
                        <ChipCloud items={brands} />
                      </CollapsibleContent>
                    </Collapsible>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </Section>
      ) : null}

      {reachability.length > 0 ? (
        <Section title={t("creatorProfile.audience.reachability")}>
          <Card>
            <CardContent className="p-4">
              <BarList items={reachability} />
            </CardContent>
          </Card>
        </Section>
      ) : null}

      {Array.isArray(analysis?.lookalikes) && analysis!.lookalikes!.length > 0 ? (
        <Section title={t("creatorProfile.audience.lookalikes")}>
          <PersonGrid
            people={analysis!.lookalikes!}
            followersLabel={t("creatorProfile.kpi.followers")}
          />
        </Section>
      ) : null}

      {Array.isArray(analysis?.notableAudience) &&
      analysis!.notableAudience!.length > 0 ? (
        <Section title={t("creatorProfile.audience.notable")}>
          <PersonGrid
            people={analysis!.notableAudience!}
            followersLabel={t("creatorProfile.kpi.followers")}
          />
        </Section>
      ) : null}
    </div>
  );
}

function CpmTable({
  cpms,
}: {
  cpms: NonNullable<CreatorSocialStats["raw_audience_json"]>["cpms"];
}) {
  const { t } = useTranslation();
  const rows = Object.entries(cpms ?? {}).filter(([, v]) => {
    if (!v) return false;
    const values = [
      v.perMill?.from,
      v.perMill?.to,
      v.perContent?.from,
      v.perContent?.to,
    ];
    return values.some((x) => x != null);
  });
  if (rows.length === 0) return null;

  const range = (from?: number | null, to?: number | null) =>
    from == null && to == null
      ? "–"
      : `${formatNumber(from ?? to)} – ${formatNumber(to ?? from)} €`;

  return (
    <Section title={t("creatorProfile.audience.cpm")}>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("creatorProfile.audience.cpmType")}</TableHead>
                <TableHead>{t("creatorProfile.audience.cpmPerMill")}</TableHead>
                <TableHead>{t("creatorProfile.audience.cpmPerContent")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="capitalize">{key}</TableCell>
                  <TableCell>
                    {range(value?.perMill?.from, value?.perMill?.to)}
                  </TableCell>
                  <TableCell>
                    {range(value?.perContent?.from, value?.perContent?.to)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Section>
  );
}

export function AudienceSection({
  stats,
  onLoadAudience,
  loading,
}: {
  stats: CreatorSocialStats;
  onLoadAudience: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const audience = stats.raw_audience_json?.audienceAnalysis ?? null;
  const likers = stats.raw_audience_json?.audienceAnalysisLikers ?? null;
  const hasAudience = !!stats.raw_audience_json && !!audience;

  if (!hasAudience) {
    if (!stats.has_audience_data) return null;
    return (
      <Alert>
        <AlertTitle>{t("creatorProfile.audience.availableTitle")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{t("creatorProfile.audience.costHint")}</p>
          <Button size="sm" onClick={onLoadAudience} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("creatorProfile.audience.loadReport")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("creatorProfile.audience.title")}
        </h2>
        <span className="text-sm text-muted-foreground">
          {t("creatorProfile.asOf", {
            date: formatRelativeDate(stats.audience_fetched_at),
          })}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Gauge
                    value={stats.credibility_score}
                    label={t("creatorProfile.audience.credibility")}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {t("creatorProfile.audience.credibilityHint", {
                  cls: stats.credibility_class ?? "–",
                })}
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>
      </div>

      <AudienceBlocks analysis={audience} />

      <CpmTable cpms={stats.raw_audience_json?.cpms ?? null} />

      {likers ? (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {t("creatorProfile.audience.likers")}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <AudienceBlocks analysis={likers} compact />
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
