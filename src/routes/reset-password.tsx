import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/winfluence-logo.png.asset.json";


export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase places tokens in the URL hash on recovery links
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setReady(true);
      return;
    }
    // Or check for existing session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setError(t("auth.errors.recoverySessionMissing"));
    });
  }, [t]);

  const schema = z
    .object({
      password: z.string().min(8, t("validation.minPassword")),
      confirm: z.string().min(8, t("validation.minPassword")),
    })
    .refine((v) => v.password === v.confirm, {
      path: ["confirm"],
      message: t("validation.passwordsMatch"),
    });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    const { error: err } = await supabase.auth.updateUser({ password: v.password });
    if (err) {
      toast.error(t("auth.errors.generic"));
      return;
    }
    toast.success(t("auth.passwordUpdated"));
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-primary tracking-tight">winfluence</div>
          <h1 className="mt-3 text-xl font-semibold">{t("auth.resetPasswordTitle")}</h1>
        </div>

        {error ? (
          <div className="text-sm text-destructive text-center">{error}</div>
        ) : !ready ? (
          <div className="text-sm text-muted-foreground text-center">{t("common.loading")}</div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="password">{t("auth.newPassword")}</Label>
              <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">{t("auth.passwordConfirm")}</Label>
              <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
              {form.formState.errors.confirm && (
                <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {t("auth.setPassword")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
