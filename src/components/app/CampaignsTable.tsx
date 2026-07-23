import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CAMPAIGN_STATUSES, type CampaignListRow } from "@/lib/campaigns-list";

export function formatDate(iso: string | null) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function statusLabel(t: (k: string) => string, s: string | null) {
  switch (s) {
    case "draft":
      return t("campaignsList.status.draft");
    case "published":
      return t("campaignsList.status.published");
    case "running":
      return t("campaignsList.status.running");
    case "expired":
      return t("campaignsList.status.expired");
    case "ended":
      return t("campaignsList.status.ended");
    case "approved":
      return t("campaignsList.status.approved");
    case "archived":
      return t("campaignsList.status.archived");
    default:
      return s ?? "–";
  }
}

export function statusVariant(
  s: string | null,
): "default" | "secondary" | "outline" | "destructive" {
  switch (s) {
    case "running":
      return "default";
    case "published":
    case "approved":
      return "secondary";
    case "draft":
    case "archived":
      return "outline";
    case "expired":
      return "destructive";
    default:
      return "secondary";
  }
}

type Props = {
  rows: CampaignListRow[];
};

export function CampaignsTable({ rows }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16"></TableHead>
          <TableHead>{t("home.tableName")}</TableHead>
          <TableHead>{t("home.tableStatus")}</TableHead>
          <TableHead>{t("home.tableStart")}</TableHead>
          <TableHead>{t("home.tableEnd")}</TableHead>
          <TableHead className="text-right">{t("home.tableBudget")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            className="cursor-pointer"
            onClick={() =>
              router.navigate({
                to: "/campaigns/$id/edit",
                params: { id: String(row.id) },
              })
            }
          >
            <TableCell>
              {row.campaign_visual_url ? (
                <img
                  src={row.campaign_visual_url}
                  alt=""
                  className="h-12 w-12 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                  <Megaphone className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </TableCell>
            <TableCell className="font-medium">{row.title}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(row.status)}>
                {statusLabel(t, row.status)}
              </Badge>
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
  );
}
