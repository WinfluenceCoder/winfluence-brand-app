import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { toast } from "sonner";

import {
  INVITE_PAGE_SIZE,
  creatorInitials,
  formatRating,
  inviteCreators,
  inviteCreatorsQueryOptions,
  type InviteCreatorRow,
} from "@/lib/campaign-invite";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_overlay/invite/$id")({
  component: InviteCreatorsOverlay,
});

const COLLAB_FILTER_VALUES = ["none", "invited", "applied", "selected", "hired"] as const;

function InviteCreatorsOverlay() {
  const { id } = Route.useParams();
  const campaignId = Number(id);
  const router = useRouter();
  const { t } = useTranslation();

  const list = useQuery(inviteCreatorsQueryOptions(campaignId));

  const [insta, setInsta] = useState(false);
  const [tiktok, setTiktok] = useState(false);
  const [youtube, setYoutube] = useState(false);
  const [minRating, setMinRating] = useState<string>("any");
  const [collabFilter, setCollabFilter] = useState<string>("any");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const rows = list.data ?? [];

  const filtered = useMemo(() => {
    const min = minRating === "any" ? null : Number(minRating);
    return rows.filter((r) => {
      if (insta && !r.insta_url) return false;
      if (tiktok && !r.tiktok_url) return false;
      if (youtube && !r.youtube_url) return false;
      if (min !== null && (r.avgRating === null || r.avgRating < min)) return false;
      if (collabFilter !== "any") {
        if (collabFilter === "none") {
          if (r.collabStatus !== null) return false;
        } else if (r.collabStatus !== collabFilter) return false;
      }
      return true;
    });
  }, [rows, insta, tiktok, youtube, minRating, collabFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / INVITE_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(
    currentPage * INVITE_PAGE_SIZE,
    currentPage * INVITE_PAGE_SIZE + INVITE_PAGE_SIZE,
  );

  const invitable = visible.filter((r) => r.collabStatus === null);
  const allVisibleSelected =
    invitable.length > 0 && invitable.every((r) => selected.has(r.id));

  function resetPage() {
    setPage(0);
  }

  function toggleRow(creatorId: number, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(creatorId);
      else next.delete(creatorId);
      return next;
    });
  }

  function toggleAllVisible(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of invitable) {
        if (checked) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });
  }

  const mutation = useMutation({
    mutationFn: () => inviteCreators(campaignId, [...selected]),
    onSuccess: (result) => {
      toast.success(
        t("invite.successToast", { count: result?.invited ?? selected.size }),
      );
      router.history.back();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("invite.errorToast"),
      );
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="relative mx-auto max-w-6xl space-y-6 p-8">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="absolute right-4 top-4 inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={t("common.close")}
        >
          <X className="h-6 w-6" />
        </button>

        <h1 className="text-2xl font-semibold tracking-tight">
          {t("invite.title")}
        </h1>

        {list.isLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("invite.loading")}
            </CardContent>
          </Card>
        ) : list.isError ? (
          <Card>
            <CardContent className="space-y-3 py-8 text-center">
              <p className="text-sm font-medium">{t("invite.errorTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {list.error instanceof Error ? list.error.message : ""}
              </p>
              <Button variant="outline" onClick={() => void list.refetch()}>
                {t("invite.retry")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-end gap-6">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={insta}
                      onCheckedChange={(v) => {
                        setInsta(v === true);
                        resetPage();
                      }}
                    />
                    {t("invite.filters.hasInsta")}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={tiktok}
                      onCheckedChange={(v) => {
                        setTiktok(v === true);
                        resetPage();
                      }}
                    />
                    {t("invite.filters.hasTiktok")}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={youtube}
                      onCheckedChange={(v) => {
                        setYoutube(v === true);
                        resetPage();
                      }}
                    />
                    {t("invite.filters.hasYoutube")}
                  </label>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("invite.filters.minRating")}
                  </Label>
                  <Select
                    value={minRating}
                    onValueChange={(v) => {
                      setMinRating(v);
                      resetPage();
                    }}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("invite.filters.any")}</SelectItem>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {t("invite.filters.ratingFrom", { value: n })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("invite.filters.collabStatus")}
                  </Label>
                  <Select
                    value={collabFilter}
                    onValueChange={(v) => {
                      setCollabFilter(v);
                      resetPage();
                    }}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("invite.filters.any")}</SelectItem>
                      {COLLAB_FILTER_VALUES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {t(`invite.collabStatus.${v}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {t("invite.empty")}
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">
                          <label className="flex items-center gap-2">
                            <Checkbox
                              checked={allVisibleSelected}
                              disabled={invitable.length === 0}
                              onCheckedChange={(v) => toggleAllVisible(v === true)}
                              aria-label={t("invite.columns.invite")}
                            />
                            <span>{t("invite.columns.invite")}</span>
                          </label>
                        </TableHead>
                        <TableHead className="w-16">
                          {t("invite.columns.photo")}
                        </TableHead>
                        <TableHead>{t("invite.columns.nickName")}</TableHead>
                        <TableHead className="text-right">
                          {t("invite.columns.followersInsta")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("invite.columns.followersTiktok")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("invite.columns.followersYoutube")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("invite.columns.rating")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((row) => (
                        <InviteRow
                          key={row.id}
                          row={row}
                          checked={selected.has(row.id)}
                          onCheckedChange={(v) => toggleRow(row.id, v)}
                        />
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                      {t("invite.pageInfo", {
                        page: currentPage + 1,
                        pages: pageCount,
                        total: filtered.length,
                      })}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 0}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        {t("invite.prevPage")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= pageCount - 1}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        {t("invite.nextPage")}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-start pt-4">
                    <Button
                      size="lg"
                      disabled={selected.size === 0 || mutation.isPending}
                      onClick={() => mutation.mutate()}
                    >
                      {t("invite.cta", { count: selected.size })}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InviteRow({
  row,
  checked,
  onCheckedChange,
}: {
  row: InviteCreatorRow;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const { t } = useTranslation();
  const hasCollab = row.collabStatus !== null;
  return (
    <TableRow>
      <TableCell>
        {hasCollab ? (
          <Badge variant="secondary">
            {t(`invite.collabStatus.${row.collabStatus}`, {
              defaultValue: row.collabStatus ?? "",
            })}
          </Badge>
        ) : (
          <Checkbox
            checked={checked}
            onCheckedChange={(v) => onCheckedChange(v === true)}
            aria-label={t("invite.columns.invite")}
          />
        )}
      </TableCell>
      <TableCell>
        <Avatar className="h-10 w-10">
          {row.foto_url ? <AvatarImage src={row.foto_url} alt="" /> : null}
          <AvatarFallback>{creatorInitials(row)}</AvatarFallback>
        </Avatar>
      </TableCell>
      <TableCell className="font-medium">{row.nick_name ?? "–"}</TableCell>
      <TableCell className="text-right text-muted-foreground">–</TableCell>
      <TableCell className="text-right text-muted-foreground">–</TableCell>
      <TableCell className="text-right text-muted-foreground">–</TableCell>
      <TableCell className="text-right">{formatRating(row.avgRating)}</TableCell>
    </TableRow>
  );
}
