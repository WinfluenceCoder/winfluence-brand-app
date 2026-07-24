import { useState } from "react";
import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ChevronLeft, Megaphone } from "lucide-react";
import { getMyCampaign, publishCampaign } from "@/lib/campaigns.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/campaigns/publish/$id")({
  component: PublishCampaignPage,
});

function toLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocal(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function makeSchema(t: (k: string) => string) {
  const req = z.string().trim().min(1, t("validation.required"));
  return z
    .object({ apply_till: req, start: req, ende: req })
    .superRefine((val, ctx) => {
      const apply = fromLocal(val.apply_till);
      const start = fromLocal(val.start);
      const ende = fromLocal(val.ende);
      const minApply = new Date();
      minApply.setDate(minApply.getDate() + 1);
      if (apply && apply.getTime() < minApply.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["apply_till"],
          message: t("campaignPublish.errors.applyTillMin"),
        });
      }
      if (apply && start && start.getTime() <= apply.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["start"],
          message: t("campaignPublish.errors.startAfterApply"),
        });
      }
      if (start && ende && ende.getTime() <= start.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ende"],
          message: t("campaignForm.errors.endAfterStart"),
        });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

function PublishCampaignPage() {
  const { id } = Route.useParams();
  const campaignId = Number(id);
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const fetchCampaign = useServerFn(getMyCampaign);
  const publish = useServerFn(publishCampaign);

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
    ende: string | null;
    apply_till: string | null;
  };

  const schema = makeSchema(t);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      apply_till: toLocal(campaign.apply_till),
      start: toLocal(campaign.start),
      ende: toLocal(campaign.ende),
    },
  });

  const errors = form.formState.errors;
  const invalidCls = "border-destructive focus-visible:ring-destructive";
  const isDraft = campaign.status === "draft";
  const [submitting, setSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      publish({
        data: {
          id: campaignId,
          apply_till: new Date(values.apply_till).toISOString(),
          start: new Date(values.start).toISOString(),
          ende: new Date(values.ende).toISOString(),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["home", "campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign", campaignId] });
      toast.success(t("campaignPublish.published"));
      router.navigate({ to: "/campaigns", search: { status: "published" } });
    },
    onError: (e: unknown) => {
      setSubmitting(false);
      const msg = e instanceof Error ? e.message : "";
      if (msg === "not-publishable-status")
        toast.error(t("campaignPublish.publishErrorStatus"));
      else if (msg === "apply-till-min")
        toast.error(t("campaignPublish.errors.applyTillMin"));
      else if (msg === "start-after-apply")
        toast.error(t("campaignPublish.errors.startAfterApply"));
      else if (msg === "end-after-start")
        toast.error(t("campaignForm.errors.endAfterStart"));
      else toast.error(t("campaignPublish.publishError"));
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setSubmitting(true);
    mutation.mutate(values);
  });

  const fieldError = (name: keyof FormValues) =>
    errors[name]?.message as string | undefined;

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6 p-8">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("common.back")}
      </button>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("campaignPublish.title")}
        </h1>
        <Button variant="outline" asChild>
          <Link
            to="/campaigns/$id/edit"
            params={{ id: String(campaignId) }}
          >
            {t("campaignPublish.editButton")}
          </Link>
        </Button>
      </div>

      {/* Read-only campaign data */}
      <Card>
        <CardHeader>
          <CardTitle>{t("campaignPublish.sections.campaign")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.campaign_visual_url ? (
            <img
              src={campaign.campaign_visual_url}
              alt=""
              className="h-64 w-full rounded-md object-cover"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center rounded-md bg-muted">
              <Megaphone className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {campaign.title ?? "–"}
            </h2>
          </div>
          {campaign.briefing && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {campaign.briefing}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>{t("campaignPublish.sections.schedule")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="apply_till">
              {t("campaignForm.labels.apply_till")} *
            </Label>
            <Input
              id="apply_till"
              type="datetime-local"
              {...form.register("apply_till")}
              className={cn(errors.apply_till && invalidCls)}
            />
            {fieldError("apply_till") && (
              <p className="mt-1 text-sm text-destructive">
                {fieldError("apply_till")}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="start">
                {t("campaignForm.labels.start")} *
              </Label>
              <Input
                id="start"
                type="datetime-local"
                {...form.register("start")}
                className={cn(errors.start && invalidCls)}
              />
              {fieldError("start") && (
                <p className="mt-1 text-sm text-destructive">
                  {fieldError("start")}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="ende">
                {t("campaignForm.labels.ende")} *
              </Label>
              <Input
                id="ende"
                type="datetime-local"
                {...form.register("ende")}
                className={cn(errors.ende && invalidCls)}
              />
              {fieldError("ende") && (
                <p className="mt-1 text-sm text-destructive">
                  {fieldError("ende")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publish */}
      <Card>
        <CardHeader>
          <CardTitle>{t("campaignPublish.sections.publish")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t("campaignPublish.explanation")}
            </p>
            <Button variant="outline" type="button" asChild>
              <Link
                to="/campaigns/preview/$id"
                params={{ id: String(campaignId) }}
              >
                {t("campaignPublish.previewButton")}
              </Link>
            </Button>
          </div>
          {!isDraft && (
            <p className="text-sm text-destructive">
              {t("campaignPublish.notDraftHint")}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={!isDraft || submitting}>
              {t("campaignPublish.publishButton")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.history.back()}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
