import { createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Upload, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const chMobileRegex = /^(?:\+41\s?|0)(?:\d{2})\s?\d{3}\s?\d{2}\s?\d{2}$/;

function makeSchema(t: (k: string) => string) {
  const urlOpt = z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^https?:\/\//i.test(v), t("validation.url"));
  const intOpt = z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d+$/.test(v), t("validation.url"));
  return z.object({
    domain: z.string().trim().min(1, t("validation.required")),
    insta_url: z.string().trim().optional().or(z.literal("")),
    brand_name: z.string().trim().optional().or(z.literal("")),
    brand_pitch: z.string().trim().optional().or(z.literal("")),
    hashtags: z.string().trim().optional().or(z.literal("")),
    linkedin_url: urlOpt,
    youtube_url: urlOpt,
    tiktok_url: urlOpt,
    billing_address_to: z.string().trim().optional().or(z.literal("")),
    billing_address_street: z.string().trim().optional().or(z.literal("")),
    billing_address_nr: intOpt,
    billing_address_zip: intOpt,
    billing_address_city: z.string().trim().optional().or(z.literal("")),
    first_name: z.string().trim().min(1, t("validation.required")),
    last_name: z.string().trim().min(1, t("validation.required")),
    job_title: z.string().trim().optional().or(z.literal("")),
    user_linkedin_url: urlOpt,
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
  const router = useRouter();
  const navigate = useNavigate({ from: "/_authenticated/profile" });
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
      brand_name: brand?.brand_name ?? "",
      brand_pitch: brand?.brand_pitch ?? "",
      hashtags: brand?.hashtags ?? "",
      linkedin_url: brand?.linkedin_url ?? "",
      youtube_url: brand?.youtube_url ?? "",
      tiktok_url: brand?.tiktok_url ?? "",
      billing_address_to: brand?.billing_address_to ?? "",
      billing_address_street: brand?.billing_address_street ?? "",
      billing_address_nr:
        brand?.billing_address_nr != null ? String(brand.billing_address_nr) : "",
      billing_address_zip:
        brand?.billing_address_zip != null ? String(brand.billing_address_zip) : "",
      billing_address_city: brand?.billing_address_city ?? "",
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(brand?.user_foto_url ?? null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const email = brand?.e_mail_address ?? "";
  const legalName = brand?.legal_name ?? "";
  const mwstNr = brand?.mwst_nr ?? "";
  const status = brand?.status ?? "";

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

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no-user");
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${uid}/photo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("user_fotos").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("user_fotos").getPublicUrl(path);
      setPhotoUrl(pub.publicUrl);
    } catch (err) {
      toast.error(t("profile.saveError"));
      console.error(err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const initials = `${brand?.first_name?.[0] ?? ""}${brand?.last_name?.[0] ?? ""}`.toUpperCase() || "?";
  const errors = form.formState.errors;
  const invalidCls = "border-destructive focus-visible:ring-destructive";
  const [logoError, setLogoError] = useState<string | null>(null);

  const onSubmitWrapped = form.handleSubmit(
    async (values) => {
      if (!logoUrl) {
        setLogoError(t("validation.required"));
        return;
      }
      setLogoError(null);
      try {
        await saveBrand({
          data: {
            domain: values.domain,
            insta_url: values.insta_url || null,
            brand_name: values.brand_name || null,
            brand_pitch: values.brand_pitch || null,
            hashtags: values.hashtags || null,
            linkedin_url: values.linkedin_url || null,
            youtube_url: values.youtube_url || null,
            tiktok_url: values.tiktok_url || null,
            billing_address_to: values.billing_address_to || null,
            billing_address_street: values.billing_address_street || null,
            billing_address_nr: values.billing_address_nr
              ? parseInt(values.billing_address_nr, 10)
              : null,
            billing_address_zip: values.billing_address_zip
              ? parseInt(values.billing_address_zip, 10)
              : null,
            billing_address_city: values.billing_address_city || null,
            first_name: values.first_name,
            last_name: values.last_name,
            job_title: values.job_title || null,
            user_linkedin_url: values.user_linkedin_url || null,
            gender: values.gender,
            mobile: values.mobile || null,
            logo_url: logoUrl,
            user_foto_url: photoUrl,
          },
        });
        toast.success(t("profile.saved"));
        await qc.invalidateQueries({ queryKey: ["my-brand"] });
      } catch (err) {
        console.error(err);
        toast.error(t("profile.saveError"));
      }
    },
    () => {
      if (!logoUrl) setLogoError(t("validation.required"));
    },
  );

  return (
    <div className="p-8 max-w-3xl">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("common.back")}
      </button>

      <h1 className="text-2xl font-semibold tracking-tight">{t("profile.title")}</h1>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("profile.status")}:</span>
        <Badge variant="secondary">{status || "—"}</Badge>
      </div>

      <form onSubmit={onSubmitWrapped} className="mt-8 space-y-10" noValidate>
        {/* Meine Firma */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">{t("profile.companySection")}</h2>

          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`h-24 w-24 rounded-lg border bg-muted overflow-hidden flex items-center justify-center ${
                  logoError ? "border-destructive" : ""
                }`}
              >
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
              {logoError && <p className="text-xs text-destructive">{logoError}</p>}
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
            <Label htmlFor="domain" className={errors.domain ? "text-destructive" : ""}>
              {t("profile.domain")}
            </Label>
            <Input
              id="domain"
              aria-invalid={!!errors.domain}
              className={errors.domain ? invalidCls : ""}
              {...form.register("domain")}
            />
            {errors.domain && <p className="text-xs text-destructive">{errors.domain.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="insta_url" className={errors.insta_url ? "text-destructive" : ""}>
              {t("profile.instaHandle")}
            </Label>
            <Input
              id="insta_url"
              aria-invalid={!!errors.insta_url}
              className={errors.insta_url ? invalidCls : ""}
              placeholder="@brand"
              {...form.register("insta_url")}
            />
            {errors.insta_url && <p className="text-xs text-destructive">{errors.insta_url.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="billing_address_to">{t("profile.billingTo")}</Label>
            <Input id="billing_address_to" {...form.register("billing_address_to")} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="billing_address_street">{t("profile.billingStreet")}</Label>
              <Input id="billing_address_street" {...form.register("billing_address_street")} />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="billing_address_nr"
                className={errors.billing_address_nr ? "text-destructive" : ""}
              >
                {t("profile.billingNr")}
              </Label>
              <Input
                id="billing_address_nr"
                inputMode="numeric"
                aria-invalid={!!errors.billing_address_nr}
                className={errors.billing_address_nr ? invalidCls : ""}
                {...form.register("billing_address_nr")}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label
                htmlFor="billing_address_zip"
                className={errors.billing_address_zip ? "text-destructive" : ""}
              >
                {t("profile.billingZip")}
              </Label>
              <Input
                id="billing_address_zip"
                inputMode="numeric"
                aria-invalid={!!errors.billing_address_zip}
                className={errors.billing_address_zip ? invalidCls : ""}
                {...form.register("billing_address_zip")}
              />
            </div>
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="billing_address_city">{t("profile.billingCity")}</Label>
              <Input id="billing_address_city" {...form.register("billing_address_city")} />
            </div>
          </div>
        </section>

        {/* Meine Brand */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">{t("profile.brandSection")}</h2>

          <div className="grid gap-2">
            <Label htmlFor="brand_name">{t("profile.brandName")}</Label>
            <Input id="brand_name" {...form.register("brand_name")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="brand_pitch">{t("profile.brandPitch")}</Label>
            <Textarea id="brand_pitch" rows={4} {...form.register("brand_pitch")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hashtags">{t("profile.keywords")}</Label>
            <Input id="hashtags" {...form.register("hashtags")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="linkedin_url" className={errors.linkedin_url ? "text-destructive" : ""}>
              {t("profile.brandLinkedin")}
            </Label>
            <Input
              id="linkedin_url"
              aria-invalid={!!errors.linkedin_url}
              className={errors.linkedin_url ? invalidCls : ""}
              placeholder="https://linkedin.com/company/…"
              {...form.register("linkedin_url")}
            />
            {errors.linkedin_url && (
              <p className="text-xs text-destructive">{errors.linkedin_url.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="youtube_url" className={errors.youtube_url ? "text-destructive" : ""}>
              {t("profile.brandYoutube")}
            </Label>
            <Input
              id="youtube_url"
              aria-invalid={!!errors.youtube_url}
              className={errors.youtube_url ? invalidCls : ""}
              placeholder="https://youtube.com/@…"
              {...form.register("youtube_url")}
            />
            {errors.youtube_url && (
              <p className="text-xs text-destructive">{errors.youtube_url.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tiktok_url" className={errors.tiktok_url ? "text-destructive" : ""}>
              {t("profile.brandTiktok")}
            </Label>
            <Input
              id="tiktok_url"
              aria-invalid={!!errors.tiktok_url}
              className={errors.tiktok_url ? invalidCls : ""}
              placeholder="https://tiktok.com/@…"
              {...form.register("tiktok_url")}
            />
            {errors.tiktok_url && (
              <p className="text-xs text-destructive">{errors.tiktok_url.message}</p>
            )}
          </div>
        </section>

        {/* Ansprechperson */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">{t("profile.contactSection")}</h2>

          <div className="grid gap-2">
            <Label className={errors.gender ? "text-destructive" : ""}>{t("profile.gender")}</Label>
            <Select
              value={form.watch("gender")}
              onValueChange={(v) => form.setValue("gender", v as FormValues["gender"], { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.gender} className={errors.gender ? invalidCls : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">{t("profile.genderFemale")}</SelectItem>
                <SelectItem value="male">{t("profile.genderMale")}</SelectItem>
                <SelectItem value="diverse">{t("profile.genderDiverse")}</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first_name" className={errors.first_name ? "text-destructive" : ""}>
                {t("profile.firstName")}
              </Label>
              <Input
                id="first_name"
                aria-invalid={!!errors.first_name}
                className={errors.first_name ? invalidCls : ""}
                {...form.register("first_name")}
              />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name" className={errors.last_name ? "text-destructive" : ""}>
                {t("profile.lastName")}
              </Label>
              <Input
                id="last_name"
                aria-invalid={!!errors.last_name}
                className={errors.last_name ? invalidCls : ""}
                {...form.register("last_name")}
              />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="job_title" className={errors.job_title ? "text-destructive" : ""}>
              {t("profile.jobTitle")}
            </Label>
            <Input
              id="job_title"
              aria-invalid={!!errors.job_title}
              className={errors.job_title ? invalidCls : ""}
              {...form.register("job_title")}
            />
            {errors.job_title && <p className="text-xs text-destructive">{errors.job_title.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user_linkedin_url" className={errors.user_linkedin_url ? "text-destructive" : ""}>
              {t("profile.linkedin")}
            </Label>
            <Input
              id="user_linkedin_url"
              aria-invalid={!!errors.user_linkedin_url}
              className={errors.user_linkedin_url ? invalidCls : ""}
              placeholder="https://linkedin.com/in/…"
              {...form.register("user_linkedin_url")}
            />
            {errors.user_linkedin_url && (
              <p className="text-xs text-destructive">{errors.user_linkedin_url.message}</p>
            )}
          </div>

          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="h-24 w-24 rounded-lg border bg-muted overflow-hidden flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="photo" className="h-full w-full object-cover" />
                ) : (
                  <Avatar className="h-full w-full rounded-none">
                    <AvatarFallback className="rounded-none text-lg">{initials}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <Label className="cursor-pointer inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Upload className="h-3 w-3" />
                {uploadingPhoto ? t("common.loading") : t("profile.uploadPhoto")}
                <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} disabled={uploadingPhoto} />
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{t("profile.photoHint")}</p>
          </div>

          <div className="grid gap-2">
            <Label>{t("profile.email")}</Label>
            <Input value={email} disabled title={t("profile.readonlyHint")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mobile" className={errors.mobile ? "text-destructive" : ""}>
              {t("profile.mobile")}
            </Label>
            <Input
              id="mobile"
              aria-invalid={!!errors.mobile}
              className={errors.mobile ? invalidCls : ""}
              placeholder="+41 79 999 99 99"
              {...form.register("mobile")}
            />
            {errors.mobile && <p className="text-xs text-destructive">{errors.mobile.message}</p>}
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
