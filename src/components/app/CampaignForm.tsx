import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { getMyBrand } from "@/lib/brands.functions";
import { createCampaign, updateCampaign } from "@/lib/campaigns.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ImageUploadField } from "@/components/app/ImageUploadField";
import { cn } from "@/lib/utils";

const CAMPAIGN_TYPES = ["Engagement mit Influencer"] as const;

function makeSchema(t: (k: string) => string) {
  const urlOpt = z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^https?:\/\//i.test(v), t("validation.url"));
  const req = (max = 255) => z.string().trim().min(1, t("validation.required")).max(max);
  const intOpt = z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d+$/.test(v), t("campaignForm.errors.integer"));
  const intReq = z
    .string()
    .trim()
    .min(1, t("validation.required"))
    .refine((v) => /^\d+$/.test(v), t("campaignForm.errors.integer"));

  return z
    .object({
      title: req(255),
      brand_name: req(255),
      brand_logo_url: req(1000),
      product: req(255),
      briefing: req(10000),
      campaign_visual_url: req(1000),
      goal: req(2000),
      targetgroup: req(1000),
      key_message: req(2000),
      budget: intReq,
      start: req(64),
      ende: req(64),
      hashtags: z.string().trim().max(500).optional().or(z.literal("")),
      link_list: z.string().trim().max(2000).optional().or(z.literal("")),
      requirements: req(10000),
      post_type: z.string().trim().max(255).optional().or(z.literal("")),
      type: z.string().trim().min(1, t("validation.required")),
      target_url: urlOpt,
      coupon: z.string().trim().max(255).optional().or(z.literal("")),
      apply_till: z.string().trim().optional().or(z.literal("")),
      barter_desc: z.string().trim().max(2000).optional().or(z.literal("")),
      barter_order_url: urlOpt,
      barter_order_coupon: z.string().trim().max(255).optional().or(z.literal("")),
      barter_value: intOpt,
    })
    .superRefine((val, ctx) => {
      if (val.start && val.ende && new Date(val.ende) <= new Date(val.start)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ende"],
          message: t("campaignForm.errors.endAfterStart"),
        });
      }
      if (val.apply_till && val.start && new Date(val.apply_till) >= new Date(val.start)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["apply_till"],
          message: t("campaignForm.errors.applyBeforeStart"),
        });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

function toLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocal(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

type Initial = Partial<FormValues> & { id?: number };

export function CampaignForm({ mode, initial }: { mode: "create" | "edit"; initial?: Initial }) {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const fetchBrand = useServerFn(getMyBrand);
  const create = useServerFn(createCampaign);
  const update = useServerFn(updateCampaign);

  const { data: brand } = useSuspenseQuery({
    queryKey: ["my-brand"],
    queryFn: () => fetchBrand(),
  });

  const schema = makeSchema(t);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      brand_name: initial?.brand_name ?? brand?.brand_name ?? "",
      brand_logo_url: initial?.brand_logo_url ?? brand?.logo_url ?? "",
      product: initial?.product ?? "",
      briefing: initial?.briefing ?? "",
      campaign_visual_url: initial?.campaign_visual_url ?? "",
      goal: initial?.goal ?? "",
      targetgroup: initial?.targetgroup ?? "",
      key_message: initial?.key_message ?? "",
      budget: initial?.budget != null ? String(initial.budget) : "",
      start: toLocal(initial?.start as string | undefined),
      ende: toLocal(initial?.ende as string | undefined),
      hashtags: initial?.hashtags ?? "",
      link_list: initial?.link_list ?? "",
      requirements: initial?.requirements ?? "",
      post_type: initial?.post_type ?? "",
      type: initial?.type ?? CAMPAIGN_TYPES[0],
      target_url: initial?.target_url ?? "",
      coupon: initial?.coupon ?? "",
      apply_till: toLocal(initial?.apply_till as string | undefined),
      barter_desc: initial?.barter_desc ?? "",
      barter_order_url: initial?.barter_order_url ?? "",
      barter_order_coupon: initial?.barter_order_coupon ?? "",
      barter_value: initial?.barter_value != null ? String(initial.barter_value) : "",
    },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const errors = form.formState.errors;
  const invalidCls = "border-destructive focus-visible:ring-destructive";

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        title: values.title,
        brand_name: values.brand_name,
        brand_logo_url: values.brand_logo_url,
        product: values.product,
        briefing: values.briefing,
        campaign_visual_url: values.campaign_visual_url,
        goal: values.goal,
        targetgroup: values.targetgroup,
        key_message: values.key_message,
        budget: parseInt(values.budget, 10),
        start: fromLocal(values.start)!,
        ende: fromLocal(values.ende)!,
        hashtags: values.hashtags || null,
        link_list: values.link_list || null,
        requirements: values.requirements,
        post_type: values.post_type || null,
        type: values.type,
        target_url: values.target_url || null,
        coupon: values.coupon || null,
        apply_till: fromLocal(values.apply_till ?? ""),
        barter_desc: values.barter_desc || null,
        barter_order_url: values.barter_order_url || null,
        barter_order_coupon: values.barter_order_coupon || null,
        barter_value: values.barter_value ? parseInt(values.barter_value, 10) : null,
      };
      if (mode === "edit" && initial?.id) {
        return update({ data: { id: initial.id, ...payload } });
      }
      return create({ data: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home", "campaigns"] });
      toast.success(mode === "edit" ? t("campaignForm.updated") : t("campaignForm.created"));
      router.navigate({ to: "/" });
    },
    onError: (e) => {
      console.error(e);
      toast.error(t("campaignForm.saveError"));
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  const handleCancel = () => {
    if (form.formState.isDirty) {
      setConfirmOpen(true);
    } else {
      router.navigate({ to: "/" });
    }
  };

  const fieldError = (name: keyof FormValues) => errors[name]?.message as string | undefined;

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "edit" ? t("campaignForm.editTitle") : t("campaignForm.newTitle")}
        </h1>
      </div>

      {/* Section 1: Titel, Brand & Produkt */}
      <Card>
        <CardHeader>
          <CardTitle>{t("campaignForm.sections.brand")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">{t("campaignForm.labels.title")} *</Label>
            <Input
              id="title"
              placeholder={t("campaignForm.placeholders.title")}
              {...form.register("title")}
              className={cn(errors.title && invalidCls)}
            />
            {fieldError("title") && <p className="mt-1 text-sm text-destructive">{fieldError("title")}</p>}
          </div>
          <div>
            <Label htmlFor="brand_name">{t("campaignForm.labels.brand_name")} *</Label>
            <Input id="brand_name" {...form.register("brand_name")} className={cn(errors.brand_name && invalidCls)} />
            {fieldError("brand_name") && <p className="mt-1 text-sm text-destructive">{fieldError("brand_name")}</p>}
          </div>
          <div>
            <Label>{t("campaignForm.labels.brand_logo_url")} *</Label>
            <ImageUploadField
              bucket="brand-logos"
              prefix="campaign-logo"
              value={form.watch("brand_logo_url") || null}
              onChange={(url) => form.setValue("brand_logo_url", url ?? "", { shouldDirty: true, shouldValidate: true })}
              hintKey="campaignForm.hints.brand_logo_url"
              error={fieldError("brand_logo_url")}
            />
          </div>
          <div>
            <Label htmlFor="product">{t("campaignForm.labels.product")} *</Label>
            <Input
              id="product"
              placeholder={t("campaignForm.placeholders.product")}
              {...form.register("product")}
              className={cn(errors.product && invalidCls)}
            />
            {fieldError("product") && <p className="mt-1 text-sm text-destructive">{fieldError("product")}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Inhalt & Briefing */}
      <Card>
        <CardHeader>
          <CardTitle>{t("campaignForm.sections.content")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="briefing">{t("campaignForm.labels.briefing")} *</Label>
            <Textarea
              id="briefing"
              rows={10}
              placeholder={t("campaignForm.placeholders.briefing")}
              {...form.register("briefing")}
              className={cn("resize-y", errors.briefing && invalidCls)}
            />
            {fieldError("briefing") && <p className="mt-1 text-sm text-destructive">{fieldError("briefing")}</p>}
          </div>
          <div>
            <Label>{t("campaignForm.labels.campaign_visual_url")} *</Label>
            <ImageUploadField
              bucket="campaign-visuals"
              prefix="visual"
              value={form.watch("campaign_visual_url") || null}
              onChange={(url) => form.setValue("campaign_visual_url", url ?? "", { shouldDirty: true, shouldValidate: true })}
              hintKey="campaignForm.hints.campaign_visual_url"
              error={fieldError("campaign_visual_url")}
            />
          </div>
          <div>
            <Label htmlFor="goal">{t("campaignForm.labels.goal")} *</Label>
            <Textarea
              id="goal"
              rows={3}
              placeholder={t("campaignForm.placeholders.goal")}
              {...form.register("goal")}
              className={cn(errors.goal && invalidCls)}
            />
            {fieldError("goal") && <p className="mt-1 text-sm text-destructive">{fieldError("goal")}</p>}
          </div>
          <div>
            <Label htmlFor="targetgroup">{t("campaignForm.labels.targetgroup")} *</Label>
            <Input
              id="targetgroup"
              placeholder={t("campaignForm.placeholders.targetgroup")}
              {...form.register("targetgroup")}
              className={cn(errors.targetgroup && invalidCls)}
            />
            {fieldError("targetgroup") && <p className="mt-1 text-sm text-destructive">{fieldError("targetgroup")}</p>}
          </div>
          <div>
            <Label htmlFor="key_message">{t("campaignForm.labels.key_message")} *</Label>
            <Textarea
              id="key_message"
              rows={3}
              placeholder={t("campaignForm.placeholders.key_message")}
              {...form.register("key_message")}
              className={cn(errors.key_message && invalidCls)}
            />
            {fieldError("key_message") && <p className="mt-1 text-sm text-destructive">{fieldError("key_message")}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="budget">{t("campaignForm.labels.budget")} *</Label>
              <Input
                id="budget"
                inputMode="numeric"
                placeholder={t("campaignForm.placeholders.budget")}
                value={formatThousands(form.watch("budget"))}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  form.setValue("budget", raw, { shouldDirty: true, shouldValidate: true });
                }}
                className={cn(errors.budget && invalidCls)}
              />
              {fieldError("budget") && <p className="mt-1 text-sm text-destructive">{fieldError("budget")}</p>}
            </div>
            <div>
              <Label htmlFor="start">{t("campaignForm.labels.start")} *</Label>
              <Input
                id="start"
                type="datetime-local"
                placeholder={t("campaignForm.placeholders.start")}
                {...form.register("start")}
                className={cn(errors.start && invalidCls)}
              />
              {fieldError("start") && <p className="mt-1 text-sm text-destructive">{fieldError("start")}</p>}
            </div>
            <div>
              <Label htmlFor="ende">{t("campaignForm.labels.ende")} *</Label>
              <Input
                id="ende"
                type="datetime-local"
                placeholder={t("campaignForm.placeholders.ende")}
                {...form.register("ende")}
                className={cn(errors.ende && invalidCls)}
              />
              {fieldError("ende") && <p className="mt-1 text-sm text-destructive">{fieldError("ende")}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="hashtags">{t("campaignForm.labels.hashtags")}</Label>
            <Input
              id="hashtags"
              placeholder={t("campaignForm.placeholders.hashtags")}
              {...form.register("hashtags")}
            />
          </div>
          <div>
            <Label htmlFor="link_list">{t("campaignForm.labels.link_list")}</Label>
            <Input
              id="link_list"
              placeholder={t("campaignForm.placeholders.link_list")}
              {...form.register("link_list")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Influencer & Post */}
      <Card>
        <CardHeader>
          <CardTitle>{t("campaignForm.sections.influencer")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="requirements">{t("campaignForm.labels.requirements")} *</Label>
            <Textarea
              id="requirements"
              rows={10}
              placeholder={t("campaignForm.placeholders.requirements")}
              {...form.register("requirements")}
              className={cn("resize-y", errors.requirements && invalidCls)}
            />
            {fieldError("requirements") && <p className="mt-1 text-sm text-destructive">{fieldError("requirements")}</p>}
          </div>
          <div>
            <Label htmlFor="post_type">{t("campaignForm.labels.post_type")}</Label>
            <Input
              id="post_type"
              placeholder={t("campaignForm.placeholders.post_type")}
              {...form.register("post_type")}
            />
          </div>
          <div>
            <Label htmlFor="type">{t("campaignForm.labels.type")} *</Label>
            <Select
              value={form.watch("type") || ""}
              onValueChange={(v) => form.setValue("type", v, { shouldDirty: true, shouldValidate: true })}
            >
              <SelectTrigger id="type" className={cn(errors.type && invalidCls)}>
                <SelectValue placeholder={t("campaignForm.placeholders.type")} />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_TYPES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError("type") && <p className="mt-1 text-sm text-destructive">{fieldError("type")}</p>}
          </div>
          <div>
            <Label htmlFor="target_url">{t("campaignForm.labels.target_url")}</Label>
            <Input
              id="target_url"
              placeholder={t("campaignForm.placeholders.target_url")}
              {...form.register("target_url")}
              className={cn(errors.target_url && invalidCls)}
            />
            {fieldError("target_url") && <p className="mt-1 text-sm text-destructive">{fieldError("target_url")}</p>}
          </div>
          <div>
            <Label htmlFor="coupon">{t("campaignForm.labels.coupon")}</Label>
            <Input
              id="coupon"
              placeholder={t("campaignForm.placeholders.coupon")}
              {...form.register("coupon")}
            />
          </div>
          <div>
            <Label htmlFor="apply_till">{t("campaignForm.labels.apply_till")}</Label>
            <Input
              id="apply_till"
              type="datetime-local"
              placeholder={t("campaignForm.placeholders.apply_till")}
              {...form.register("apply_till")}
              className={cn(errors.apply_till && invalidCls)}
            />
            {fieldError("apply_till") && <p className="mt-1 text-sm text-destructive">{fieldError("apply_till")}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Barter */}
      <Card>
        <CardHeader>
          <CardTitle>{t("campaignForm.sections.barter")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="barter_desc">{t("campaignForm.labels.barter_desc")}</Label>
            <Textarea
              id="barter_desc"
              rows={3}
              placeholder={t("campaignForm.placeholders.barter_desc")}
              {...form.register("barter_desc")}
            />
          </div>
          <div>
            <Label htmlFor="barter_order_url">{t("campaignForm.labels.barter_order_url")}</Label>
            <Input
              id="barter_order_url"
              placeholder={t("campaignForm.placeholders.barter_order_url")}
              {...form.register("barter_order_url")}
              className={cn(errors.barter_order_url && invalidCls)}
            />
            {fieldError("barter_order_url") && <p className="mt-1 text-sm text-destructive">{fieldError("barter_order_url")}</p>}
          </div>
          <div>
            <Label htmlFor="barter_order_coupon">{t("campaignForm.labels.barter_order_coupon")}</Label>
            <Input
              id="barter_order_coupon"
              placeholder={t("campaignForm.placeholders.barter_order_coupon")}
              {...form.register("barter_order_coupon")}
            />
          </div>
          <div>
            <Label htmlFor="barter_value">{t("campaignForm.labels.barter_value")}</Label>
            <Input
              id="barter_value"
              inputMode="numeric"
              placeholder={t("campaignForm.placeholders.barter_value")}
              {...form.register("barter_value")}
              className={cn(errors.barter_value && invalidCls)}
            />
            {fieldError("barter_value") && <p className="mt-1 text-sm text-destructive">{fieldError("barter_value")}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={mutation.isPending}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t("common.loading") : t("common.save")}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("campaignForm.discardTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("campaignForm.discardBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.navigate({ to: "/" })}>
              {t("campaignForm.discardConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
