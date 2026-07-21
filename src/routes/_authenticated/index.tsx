import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Megaphone } from "lucide-react";

const activeStatuses = ["draft", "published", "running", "expired", "ended"] as const;

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

type CampaignRow = {
  id: number;
  title: string | null;
  status: string | null;
  start: string | null;
  ende: string | null;
  budget: number | null;
  campaign_visual_url: string | null;
};

function useMyCampaigns() {
  return useSuspenseQuery({
    queryKey: ["home", "campaigns"],
    queryFn: async () => {
      const { data: brand } = await supabase
        .from("brands")
        .select("id")
        .maybeSingle();
      if (!brand) return [] as CampaignRow[];
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, title, status, start, ende, budget, campaign_visual_url")
        .eq("brand_id", brand.id)
        .in("status", activeStatuses as unknown as string[])
        .order("created_at", { ascending: false })
        .returns<CampaignRow[]>();

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

function formatDate(iso: string | null) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusLabel(t: (k: string) => string, s: string | null) {
  switch (s) {
    case "draft":
      return t("home.statusDraft");
    case "published":
      return t("home.statusPublished");
    case "running":
      return t("home.statusRunning");
    case "expired":
      return t("home.statusExpired");
    case "ended":
      return t("home.statusEnded");
    default:
      return s ?? "–";
  }
}

function statusVariant(s: string | null): "default" | "secondary" | "outline" | "destructive" {
  switch (s) {
    case "running":
      return "default";
    case "published":
      return "secondary";
    case "draft":
      return "outline";
    case "expired":
      return "destructive";
    default:
      return "secondary";
  }
}

function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data } = useMyCampaigns();

  if (!data || data.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("home.title")}</h1>
        <button
          type="button"
          onClick={() => router.navigate({ to: "/campaigns/new" })}
          className="mt-6 flex w-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-16 text-center transition-colors hover:border-primary hover:bg-accent"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <Megaphone className="h-7 w-7" />
            </div>
            <div className="text-lg font-semibold">{t("home.emptyTitle")}</div>
            <p className="text-sm text-muted-foreground max-w-md">{t("home.emptySub")}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" /> {t("home.newCampaign")}
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("home.title")}</h1>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{t("home.campaignsTitle")}</CardTitle>
          <Button asChild>
            <Link to="/campaigns/new">
              <Plus className="h-4 w-4 mr-1" /> {t("home.newCampaign")}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("home.tableName")}</TableHead>
                <TableHead>{t("home.tableStatus")}</TableHead>
                <TableHead>{t("home.tableStart")}</TableHead>
                <TableHead>{t("home.tableEnd")}</TableHead>
                <TableHead className="text-right">{t("home.tableBudget")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.navigate({ to: "/campaigns/$id/edit", params: { id: String(row.id) } })
                  }
                >
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(row.status)}>{statusLabel(t, row.status)}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(row.start)}</TableCell>
                  <TableCell>{formatDate(row.ende)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.budget != null ? `CHF ${row.budget.toLocaleString("de-CH")}` : "–"}
                  </TableCell>
                </TableRow>
              ))}

            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
