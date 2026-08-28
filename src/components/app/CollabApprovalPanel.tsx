import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { CollabApproval, CollabDialogData } from "@/lib/collab-dialog";
import { cn } from "@/lib/utils";

const FEEDBACK_MIN = 20;

function describe(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

function StarRating({
  value,
  onChange,
  ariaLabel,
  starLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  ariaLabel: string;
  starLabel: (n: number) => string;
}) {
  const filled = value ?? 0;
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex items-center gap-0.5"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(Math.min(5, filled + 1));
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          const next = filled - 1;
          onChange(next < 1 ? null : next);
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={filled === n}
          aria-label={starLabel(n)}
          tabIndex={n === Math.max(1, filled) ? 0 : -1}
          onClick={() => onChange(filled === n ? null : n)}
          className="rounded-sm p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            className={cn(
              "h-5 w-5",
              n <= filled
                ? "fill-current text-foreground"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function CollabApprovalPanel({
  collab,
  campaignId,
  brandId,
  onDone,
  closeSlot,
}: {
  collab: CollabDialogData;
  campaignId: number;
  brandId: number;
  onDone: () => void;
  closeSlot: ReactNode;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const dbApproval = collab.approval ?? null;
  const dbRating = collab.brand_rating ?? null;
  const dbFeedback = collab.brand_feedback ?? null;
  const prefilled = dbApproval != null;

  const [expanded, setExpanded] = useState(prefilled);
  const [approval, setApproval] = useState<CollabApproval | null>(dbApproval);
  const [rating, setRating] = useState<number | null>(dbRating);
  const [feedback, setFeedback] = useState(dbFeedback ?? "");
  const [savedFeedback, setSavedFeedback] = useState(
    dbFeedback && dbFeedback.trim().length >= FEEDBACK_MIN ? dbFeedback : "",
  );
  const [favorite, setFavorite] = useState(false);
  const [wasFavorite, setWasFavorite] = useState(false);

  const creatorId = collab.creator.id;

  // Favoriten-Status laden, sobald das Panel offen ist.
  useEffect(() => {
    if (!expanded) return;
    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("brand_id", brandId)
        .eq("creator_id", creatorId)
        .maybeSingle();
      if (!active || error) return;
      setWasFavorite(data != null);
      setFavorite(data != null);
    })();
    return () => {
      active = false;
    };
  }, [expanded, brandId, creatorId]);

  async function patchCollab(patch: Record<string, unknown>) {
    const { error } = await supabase
      .from("collabs")
      // Neue Spalten sind in den generierten Typen noch nicht enthalten.
      .update(patch as never)
      .eq("id", collab.id);
    if (error) throw new Error(error.message);
  }

  const saveApproval = useMutation({
    mutationFn: (value: CollabApproval) => patchCollab({ approval: value }),
    onError: (e) => {
      setApproval(dbApproval);
      toast.error(describe(e));
    },
  });

  const saveRating = useMutation({
    mutationFn: (value: number | null) => patchCollab({ brand_rating: value }),
    onError: (e) => {
      setRating(dbRating);
      toast.error(describe(e));
    },
  });

  const saveFeedback = useMutation({
    mutationFn: (value: string) => patchCollab({ brand_feedback: value }),
    onSuccess: (_d, value) => setSavedFeedback(value),
    onError: (e) => {
      setSavedFeedback("");
      toast.error(describe(e));
    },
  });

  const finalize = useMutation({
    mutationFn: async () => {
      if (approval == null) return;
      const rejected = approval === "rejected";
      await patchCollab({ status: rejected ? "rejected" : "approved" });

      if (!rejected) {
        if (favorite) {
          const { error } = await supabase
            .from("favorites")
            // Tabelle ist in den generierten Typen noch nicht enthalten.
            .upsert({ brand_id: brandId, creator_id: creatorId } as never, {
              onConflict: "brand_id,creator_id",
              ignoreDuplicates: true,
            });
          if (error) throw new Error(error.message);
        } else if (wasFavorite) {
          const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("brand_id", brandId)
            .eq("creator_id", creatorId);
          if (error) throw new Error(error.message);
        }
      }
      return rejected;
    },
    onSuccess: (rejected) => {
      toast.success(
        rejected
          ? t("collabDialog.approval.toastRejected")
          : t("collabDialog.approval.toastApproved"),
      );
      onDone();
      void queryClient.invalidateQueries({
        queryKey: ["campaign-monitoring", campaignId],
      });
    },
    onError: (e) => toast.error(describe(e)),
  });

  const isRejected = approval === "rejected";
  const feedbackOk = savedFeedback.trim().length >= FEEDBACK_MIN;
  const canFinalize =
    approval != null && rating != null && rating >= 1 && feedbackOk;

  return (
    <>
      {expanded ? (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("collabDialog.approval.title")}
            </div>

            <Row label={t("collabDialog.approval.fulfillment")}>
              <Select
                value={approval ?? undefined}
                onValueChange={(v) => {
                  const value = v as CollabApproval;
                  setApproval(value);
                  saveApproval.mutate(value);
                }}
              >
                <SelectTrigger className="w-56">
                  <SelectValue
                    placeholder={t("collabDialog.approval.fulfillment")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rejected">
                    {t("collabDialog.approval.notFulfilled")}
                  </SelectItem>
                  <SelectItem value="approved">
                    {t("collabDialog.approval.fulfilled")}
                  </SelectItem>
                  <SelectItem value="expectations_exceeded">
                    {t("collabDialog.approval.exceeded")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Row>

            {approval != null ? (
              <Row label={t("collabDialog.approval.rating")}>
                <StarRating
                  value={rating}
                  ariaLabel={t("collabDialog.approval.rating")}
                  starLabel={(n) =>
                    t("collabDialog.approval.starLabel", { count: n })
                  }
                  onChange={(v) => {
                    setRating(v);
                    saveRating.mutate(v);
                  }}
                />
              </Row>
            ) : null}

            {rating != null && rating >= 1 ? (
              <div className="space-y-1">
                <div className="text-sm">
                  {t("collabDialog.approval.feedback")}
                </div>
                <Textarea
                  value={feedback}
                  rows={3}
                  onChange={(e) => setFeedback(e.target.value)}
                  onBlur={() => {
                    const value = feedback.trim();
                    if (value.length >= FEEDBACK_MIN && value !== savedFeedback) {
                      saveFeedback.mutate(value);
                    }
                  }}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {feedback.trim().length < FEEDBACK_MIN
                      ? t("collabDialog.approval.feedbackMin")
                      : ""}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {feedback.trim().length}/{FEEDBACK_MIN}
                  </span>
                </div>
              </div>
            ) : null}

            {feedbackOk ? (
              <Row label={t("collabDialog.approval.addFavorite")}>
                <Switch
                  checked={favorite}
                  onCheckedChange={setFavorite}
                  aria-label={t("collabDialog.approval.addFavorite")}
                />
              </Row>
            ) : null}
          </div>
        </>
      ) : null}

      <Separator />
      <div className="flex items-center justify-between gap-2">
        <Button
          variant={isRejected ? "destructive" : "default"}
          disabled={expanded ? !canFinalize || finalize.isPending : false}
          onClick={() => {
            if (!expanded) {
              setExpanded(true);
              return;
            }
            finalize.mutate();
          }}
        >
          {isRejected
            ? t("collabDialog.approval.rejectButton")
            : t("collabDialog.approval.approveButton")}
        </Button>
        <div className="flex gap-2">{closeSlot}</div>
      </div>
    </>
  );
}
