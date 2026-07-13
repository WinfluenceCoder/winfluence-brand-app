import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/winfluence-logo.png.asset.json";


type Mode = "login" | "register" | "forgot";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function makeSchemas(t: (k: string) => string) {
  const email = z.string().trim().email(t("validation.email")).max(255);
  const password = z.string().min(8, t("validation.minPassword")).max(200);
  return {
    login: z.object({ email, password }),
    register: z.object({ email, password }),
    forgot: z.object({ email }),
  };
}

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [banner, setBanner] = useState<string | null>(null);

  const schemas = makeSchemas(t);

  const loginForm = useForm<z.infer<typeof schemas.login>>({
    resolver: zodResolver(schemas.login),
    defaultValues: { email: "", password: "" },
  });
  const registerForm = useForm<z.infer<typeof schemas.register>>({
    resolver: zodResolver(schemas.register),
    defaultValues: { email: "", password: "" },
  });
  const forgotForm = useForm<z.infer<typeof schemas.forgot>>({
    resolver: zodResolver(schemas.forgot),
    defaultValues: { email: "" },
  });

  const mapAuthError = (err?: { message?: string | null; code?: string | null } | null) => {
    const msg = (err?.message ?? "").toLowerCase();
    const code = (err?.code ?? "").toLowerCase();
    if (code === "weak_password" || msg.includes("weak") || msg.includes("pwned")) return t("auth.errors.weakPassword");
    if (code === "user_already_exists" || msg.includes("already registered") || msg.includes("user already")) return t("auth.errors.userExists");
    if (code === "email_address_invalid" || msg.includes("invalid email") || msg.includes("email address") && msg.includes("invalid")) return t("auth.errors.emailInvalid");
    if (code === "over_email_send_rate_limit" || msg.includes("rate limit") || msg.includes("too many")) return t("auth.errors.rateLimit");
    if (msg.includes("invalid login") || msg.includes("invalid credentials")) return t("auth.errors.invalidCredentials");
    if (msg.includes("email not confirmed")) return t("auth.errors.emailNotConfirmed");
    if (msg.includes("network") || msg.includes("fetch")) return t("auth.errors.network");
    return err?.message || t("auth.errors.generic");
  };

  const onLogin = async (v: z.infer<typeof schemas.login>) => {
    setBanner(null);
    const { error } = await supabase.auth.signInWithPassword(v);
    if (error) {
      toast.error(mapAuthError(error));
      return;
    }
    navigate({ to: "/" });
  };

  const onRegister = async (v: z.infer<typeof schemas.register>) => {
    setBanner(null);
    const { error } = await supabase.auth.signUp({
      email: v.email,
      password: v.password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast.error(mapAuthError(error));
      return;
    }
    setBanner(t("auth.signupConfirm"));
  };

  const onForgot = async (v: z.infer<typeof schemas.forgot>) => {
    setBanner(null);
    const { error } = await supabase.auth.resetPasswordForEmail(v.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(mapAuthError(error));
      return;
    }
    setBanner(t("auth.resetLinkSent"));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="text-center mb-6">
          <img src={logo.url} alt="winfluence" className="h-8 w-auto mx-auto" />
          <h1 className="mt-3 text-xl font-semibold">
            {mode === "login" && t("auth.welcome")}
            {mode === "register" && t("auth.registerTitle")}
            {mode === "forgot" && t("auth.forgotPassword")}
          </h1>
        </div>

        {banner ? (
          <div className="mb-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
            {banner}
          </div>
        ) : null}

        {mode === "login" && (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" autoComplete="email" {...loginForm.register("email")} />
              {loginForm.formState.errors.email && (
                <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" autoComplete="current-password" {...loginForm.register("password")} />
              {loginForm.formState.errors.password && (
                <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
              {t("auth.login")}
            </Button>
            <div className="pt-2 space-y-1 text-sm text-center">
              <button type="button" onClick={() => { setBanner(null); setMode("register"); }} className="text-primary hover:underline block w-full">
                {t("auth.registerLink")}
              </button>
              <button type="button" onClick={() => { setBanner(null); setMode("forgot"); }} className="text-muted-foreground hover:text-foreground hover:underline block w-full">
                {t("auth.forgotPassword")}
              </button>
            </div>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="remail">{t("auth.email")}</Label>
              <Input id="remail" type="email" autoComplete="email" {...registerForm.register("email")} />
              {registerForm.formState.errors.email && (
                <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rpassword">{t("auth.password")}</Label>
              <Input id="rpassword" type="password" autoComplete="new-password" {...registerForm.register("password")} />
              {registerForm.formState.errors.password && (
                <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
              {t("auth.register")}
            </Button>
            <button type="button" onClick={() => { setBanner(null); setMode("login"); }} className="text-primary hover:underline block w-full text-sm text-center pt-2">
              {t("auth.loginLink")}
            </button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="femail">{t("auth.email")}</Label>
              <Input id="femail" type="email" autoComplete="email" {...forgotForm.register("email")} />
              {forgotForm.formState.errors.email && (
                <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={forgotForm.formState.isSubmitting}>
              {t("auth.sendResetLink")}
            </Button>
            <button type="button" onClick={() => { setBanner(null); setMode("login"); }} className="text-primary hover:underline block w-full text-sm text-center pt-2">
              {t("common.back")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
