import { Suspense, useState } from "react";
import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { getMyCampaign } from "@/lib/campaigns.functions";
import { startSelectionQueryOptions, formatChf } from "@/lib/campaign-curation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignCard } from "@/components/app/CampaignCard";


export const Route = createFileRoute("/_authenticated/campaigns/start/$id")({
  component: StartCampaignPage,
});

function formatDateCh(iso: string | null | undefined): string {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function initials(first: string | null, last: string | null, nick: string | null) {
  const a = (first ?? nick ?? "").trim().charAt(0);
  const b = (last ?? "").trim().charAt(0);
  return `${a}${b}`.toUpperCase() || "–";
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function StartCampaignPage() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("common.back")}
      </button>
      <Suspense fallback={<PageSkeleton />}>
        <StartCampaignContent />
      </Suspense>
    </div>
  );
}

function StartCampaignContent() {
  const { id } = Route.useParams();
  const campaignId = Number(id);
  const { t } = useTranslation();
  const router = useRouter();
  const fetchCampaign = useServerFn(getMyCampaign);
  const [agbAccepted, setAgbAccepted] = useState(false);

  const { data } = useSuspenseQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => fetchCampaign({ data: { id: campaignId } }),
  });

  const campaign = data as unknown as {
    id: number;
    title: string | null;
    briefing: string | null;
    campaign_visual_url: string | null;
    status: string | null;
    start: string | null;
  };

  const selection = useQuery(startSelectionQueryOptions(campaignId));
  const rows = selection.data ?? [];
  const total = rows.reduce((sum, r) => sum + (r.price ?? 0), 0);
  const hasRows = rows.length > 0;

  const qc = useQueryClient();
  const [failureDetail, setFailureDetail] = useState<string | null>(null);

  const startMutation = useMutation({
    mutationFn: async () => {
      // start_campaign ist nicht in den generierten Typen enthalten (externe DB)
      const { data: result, error } = await (
        supabase.rpc as unknown as (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: unknown; error: { message: string } | null }>
      )("start_campaign", {
        p_campaign_id: campaignId,
      });
      if (error) throw new Error(error.message);
      return result;
    },


    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["home", "campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign", campaignId] });
      toast.success(t("campaigns.start.successToast"));
      router.navigate({ to: "/campaigns", search: { status: "running" } });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[start_campaign]", e);
      setFailureDetail(msg);
    },
  });

  const locked = startMutation.isPending || failureDetail !== null;

  const handleStart = () => {
    if (locked || !agbAccepted || !hasRows) return;
    startMutation.mutate();
  };


  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("campaigns.start.title")}
      </h1>

      <CampaignCard
        campaign={campaign}
        id={campaignId}
        status={campaign.status ?? null}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("campaigns.start.selectedInfluencers")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selection.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : selection.isError ? (
            <p className="text-sm text-destructive">
              {t("campaigns.start.loadError")}
            </p>
          ) : !hasRows ? (
            <p className="text-sm text-muted-foreground">
              {t("campaigns.start.empty")}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("campaigns.start.columns.photo")}</TableHead>
                    <TableHead>{t("campaigns.start.columns.nickName")}</TableHead>
                    <TableHead>{t("campaigns.start.columns.firstName")}</TableHead>
                    <TableHead>{t("campaigns.start.columns.lastName")}</TableHead>
                    <TableHead>{t("campaigns.start.columns.email")}</TableHead>
                    <TableHead>{t("campaigns.start.columns.mobile")}</TableHead>
                    <TableHead className="text-right">
                      {t("campaigns.start.columns.price")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-transparent">
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          {row.creator.foto_url && (
                            <AvatarImage src={row.creator.foto_url} alt="" />
                          )}
                          <AvatarFallback className="text-xs">
                            {initials(
                              row.creator.first_name,
                              row.creator.last_name,
                              row.creator.nick_name,
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>{row.creator.nick_name ?? "–"}</TableCell>
                      <TableCell>{row.creator.first_name ?? "–"}</TableCell>
                      <TableCell>{row.creator.last_name ?? "–"}</TableCell>
                      <TableCell>{row.creator.e_mail_address ?? "–"}</TableCell>
                      <TableCell>{row.creator.mobile ?? "–"}</TableCell>
                      <TableCell className="text-right">
                        {formatChf(row.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="font-bold">
                {t("campaigns.start.totalCost", { amount: formatChf(total) })}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("campaigns.start.sectionTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("campaigns.start.explanation", {
              amount: formatChf(total),
              date: formatDateCh(campaign.start),
            })}
          </p>
          <div className="flex items-start gap-2">
            <Checkbox
              id="agb-start"
              checked={agbAccepted}
              disabled={locked}
              onCheckedChange={(v) => setAgbAccepted(v === true)}
            />
            <Label htmlFor="agb-start" className="text-sm font-normal leading-snug">
              {t("campaigns.start.agbBefore")}
              <Link to="/terms" target="_blank" className="underline">
                {t("campaigns.start.agbLinkLabel")}
              </Link>
              {t("campaigns.start.agbAfter")}
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleStart}
              disabled={locked || !agbAccepted || !hasRows}
            >
              {startMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("campaigns.start.loading")}
                </>
              ) : (
                t("campaigns.start.ctaButton")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={locked}
              onClick={() => router.history.back()}
            >
              {t("campaigns.start.cancelButton")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {failureDetail !== null && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-destructive">
            {t("campaigns.start.errorMessage")}
          </p>
          {failureDetail && (
            <p className="text-xs text-muted-foreground">{failureDetail}</p>
          )}
        </div>
      )}

    </>
  );
}
