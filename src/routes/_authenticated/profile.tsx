import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "sonner";
import { getMyBrand, updateMyBrand } from "@/lib/brands.functions";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const chMobileRegex = /^(?:\+41\s?|0)(?:\d{2})\s?\d{3}\s?\d{2}\s?\d{2}$/;

function makeSchema(t: (k: string) => string) {
  return z.object({
    domain: z.string().trim().min(1, t("validation.required")),
    insta_url: z.string().trim().optional().or(z.literal("")),
    first_name: z.string().trim().min(1, t("validation.required")),
    last_name: z.string().trim().min(1, t("validation.required")),
    job_title: z.string().trim().optional().or(z.literal("")),
    user_linkedin_url: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || /^https?:\/\//i.test(v), t("validation.url")),
    gender: z.enum(["female", "male", "diverse"], {
      message: t("validation.required"),
    }),
    mobile: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || chMobileRegex.test(v), t("validation.mobileCH")),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

function ProfilePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fetchBrand = useServerFn(getMyBrand);
  const saveBrand = useServerFn(updateMyBrand);

  const { data: brand } = useSuspenseQuery({
    queryKey: ["my-brand"],
    queryFn: () => fetchBrand(),
  });

  const schema = makeSchema(t);
  const genderInitial: FormValues["gender"] = brand?.is_female
    ? "female"
    : brand?.is_male
    ? "male"
    : brand?.is_female === false && brand?.is_male === false
    ? "diverse"
    : "female";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      domain: brand?.domain ?? "",
      insta_url: brand?.insta_url ?? "",
      first_name: brand?.first_name ?? "",
      last_name: brand?.last_name ?? "",
      job_title: brand?.job_title ?? "",
      user_linkedin_url: brand?.user_linkedin_url ?? "",
      gender: genderInitial,
      mobile: brand?.mobile ?? "",
    },
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(brand?.logo_url ?? null);
  const [uploading, setUploading] = useState(false);

  const email = brand?.e_mail_address ?? "";
  const legalName = brand?.legal_name ?? "";
  const mwstNr = brand?.mwst_nr ?? "";

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no-user");
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${uid}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("brand-logos").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("brand-logos").getPublicUrl(path);
      setLogoUrl(pub.publicUrl);
    } catch (err) {
      toast.error(t("profile.saveError"));
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!logoUrl) {
      toast.error(t("validation.required"));
      return;
    }
    try {
      await saveBrand({
        data: {
          ...values,
          insta_url: values.insta_url || null,
          job_title: values.job_title || null,
          user_linkedin_url: values.user_linkedin_url || null,
          mobile: values.mobile || null,
          brand_name: brand?.brand_name ?? null,
          logo_url: logoUrl,
        },
      });
      toast.success(t("profile.saved"));
      await qc.invalidateQueries({ queryKey: ["my-brand"] });
    } catch (err) {
      console.error(err);
      toast.error(t("profile.saveError"));
    }
  };

  const initials = `${brand?.first_name?.[0] ?? ""}${brand?.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">{t("profile.title")}</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-10">
        {/* Firma */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">{t("profile.companySection")}</h2>

          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="h-24 w-24 rounded-lg border bg-muted overflow-hidden flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="logo" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <Label className="cursor-pointer inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Upload className="h-3 w-3" />
                {uploading ? t("common.loading") : t("profile.uploadLogo")}
                <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} disabled={uploading} />
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{t("profile.logoHint")}</p>
          </div>

          <div className="grid gap-2">
            <Label>{t("profile.legalName")}</Label>
            <Input value={legalName} disabled title={t("profile.readonlyHint")} />
          </div>

          <div className="grid gap-2">
            <Label>{t("profile.mwstNr")}</Label>
            <Input value={mwstNr} disabled placeholder="CHE-999.999.999" title={t("profile.readonlyHint")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="domain">{t("profile.domain")}</Label>
            <Input id="domain" {...form.register("domain")} />
            {form.formState.errors.domain && (
              <p className="text-xs text-destructive">{form.formState.errors.domain.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="insta_url">{t("profile.instaHandle")}</Label>
            <Input id="insta_url" {...form.register("insta_url")} placeholder="@brand" />
          </div>
        </section>

        {/* Ansprechperson */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">{t("profile.contactSection")}</h2>

          <div className="grid gap-2">
            <Label>{t("profile.gender")}</Label>
            <Select
              value={form.watch("gender")}
              onValueChange={(v) => form.setValue("gender", v as FormValues["gender"], { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">{t("profile.genderFemale")}</SelectItem>
                <SelectItem value="male">{t("profile.genderMale")}</SelectItem>
                <SelectItem value="diverse">{t("profile.genderDiverse")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first_name">{t("profile.firstName")}</Label>
              <Input id="first_name" {...form.register("first_name")} />
              {form.formState.errors.first_name && (
                <p className="text-xs text-destructive">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">{t("profile.lastName")}</Label>
              <Input id="last_name" {...form.register("last_name")} />
              {form.formState.errors.last_name && (
                <p className="text-xs text-destructive">{form.formState.errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="job_title">{t("profile.jobTitle")}</Label>
            <Input id="job_title" {...form.register("job_title")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user_linkedin_url">{t("profile.linkedin")}</Label>
            <Input id="user_linkedin_url" {...form.register("user_linkedin_url")} placeholder="https://linkedin.com/in/…" />
            {form.formState.errors.user_linkedin_url && (
              <p className="text-xs text-destructive">{form.formState.errors.user_linkedin_url.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              {brand?.user_foto_url ? <AvatarImage src={brand.user_foto_url} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{t("profile.photo")}</span>
          </div>

          <div className="grid gap-2">
            <Label>{t("profile.email")}</Label>
            <Input value={email} disabled title={t("profile.readonlyHint")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mobile">{t("profile.mobile")}</Label>
            <Input id="mobile" {...form.register("mobile")} placeholder="+41 79 999 99 99" />
            {form.formState.errors.mobile && (
              <p className="text-xs text-destructive">{form.formState.errors.mobile.message}</p>
            )}
          </div>
        </section>

        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {t("common.save")}
          </Button>
          <span
            aria-disabled
            className="text-sm text-muted-foreground opacity-50 cursor-not-allowed select-none"
            title={t("common.comingSoon")}
          >
            {t("profile.deleteProfile")}
          </span>
        </div>
      </form>
    </div>
  );
}
