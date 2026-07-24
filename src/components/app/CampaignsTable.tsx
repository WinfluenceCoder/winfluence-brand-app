import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Megaphone, MoreVertical } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CAMPAIGN_STATUSES, type CampaignListRow } from "@/lib/campaigns-list";
import {
  deleteCampaign,
  getCampaignDeletability,
} from "@/lib/campaigns.functions";
import {
  getCampaignWorkflow,
  type WorkflowAction,
} from "@/lib/campaign-workflow";

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
  statusFilter?: { value: string; onChange: (v: string) => void };
};

export function CampaignsTable({ rows, statusFilter }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const fetchDeletability = useServerFn(getCampaignDeletability);
  const remove = useServerFn(deleteCampaign);

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["home", "campaigns"] });
      toast.success(t("campaignForm.deleted"));
      setPendingDeleteId(null);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "not-deletable-status")
        toast.error(t("campaignForm.deleteErrorStatus"));
      else if (msg === "has-collabs")
        toast.error(t("campaignForm.deleteErrorCollabs"));
      else toast.error(t("campaignForm.deleteError"));
      setPendingDeleteId(null);
    },
  });

  const requestDelete = async (id: number) => {
    try {
      const res = await fetchDeletability({ data: { id } });
      if (!res.canDelete) {
        if (res.reason === "status")
          toast.error(t("campaignForm.deleteErrorStatus"));
        else if (res.reason === "collabs")
          toast.error(t("campaignForm.deleteErrorCollabs"));
        else toast.error(t("campaignForm.deleteError"));
        return;
      }
      setPendingDeleteId(id);
    } catch {
      toast.error(t("campaignForm.deleteError"));
    }
  };

  const renderMenuItem = (id: number, action: WorkflowAction) => {
    const Icon = action.icon;
    if (action.key === "delete") {
      return (
        <DropdownMenuItem
          key={action.key}
          className="text-destructive focus:text-destructive"
          onSelect={() => {
            void requestDelete(id);
          }}
        >
          <Icon className="h-4 w-4" />
          {t(action.labelKey)}
        </DropdownMenuItem>
      );
    }
    if (action.openInNewTab) {
      const href = action.route.to.replace("$id", String(id));
      return (
        <DropdownMenuItem key={action.key} asChild>
          <a href={href} target="_blank" rel="noopener noreferrer">
            <Icon className="h-4 w-4" />
            {t(action.labelKey)}
          </a>
        </DropdownMenuItem>
      );
    }
    return (
      <DropdownMenuItem
        key={action.key}
        onSelect={() =>
          router.navigate({
            to: action.route.to,
            params: { id: String(id) },
          })
        }
      >
        <Icon className="h-4 w-4" />
        {t(action.labelKey)}
      </DropdownMenuItem>
    );
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16"></TableHead>
            <TableHead>{t("home.tableName")}</TableHead>
            <TableHead className="p-0">
              {statusFilter ? (
                <Select value={statusFilter.value} onValueChange={statusFilter.onChange}>
                  <SelectTrigger className="h-auto w-auto gap-1 border-0 bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground shadow-none hover:text-foreground focus:ring-0 focus-visible:ring-0 [&>svg]:opacity-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("campaignsList.filterAll")}</SelectItem>
                    {CAMPAIGN_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`campaignsList.status.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="px-4">{t("home.tableStatus")}</span>
              )}
            </TableHead>
            <TableHead>{t("campaignsList.actions.nextStep")}</TableHead>
            <TableHead>{t("home.tableStart")}</TableHead>
            <TableHead>{t("home.tableEnd")}</TableHead>
            <TableHead className="text-right">{t("home.tableBudget")}</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const wf = getCampaignWorkflow(row.status);
            const next = wf.nextStep;
            const NextIcon = next?.icon;
            return (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() =>
                  router.navigate({
                    to: wf.rowClick.to,
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
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {next && NextIcon ? (
                    <Link
                      to={next.route.to}
                      params={{ id: String(row.id) }}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
                    >
                      <NextIcon className="h-4 w-4" />
                      {t(next.labelKey)}
                    </Link>
                  ) : (
                    "–"
                  )}
                </TableCell>
                <TableCell>{formatDate(row.start)}</TableCell>
                <TableCell>{formatDate(row.ende)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.budget != null ? `CHF ${row.budget.toLocaleString("de-CH")}` : "–"}
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={t("campaignsList.actions.openMenu")}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {wf.menu.map((action, idx) => {
                        const isLast = idx === wf.menu.length - 1;
                        const needsSeparator =
                          action.destructive && !isLast === false && idx > 0
                            ? true
                            : action.destructive && idx > 0;
                        return (
                          <div key={action.key}>
                            {needsSeparator ? <DropdownMenuSeparator /> : null}
                            {renderMenuItem(row.id, action)}
                          </div>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("campaignForm.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("campaignForm.deleteConfirmBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (pendingDeleteId !== null) deleteMutation.mutate(pendingDeleteId);
              }}
              disabled={deleteMutation.isPending}
            >
              {t("campaignForm.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
