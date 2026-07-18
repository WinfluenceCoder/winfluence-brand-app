import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import logo from "@/assets/winfluence-logo.png";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

type Status = "loading" | "invalid" | "ready" | "submitting";

function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let done = false;

    const apply = (sessionEmail: string | null | undefined) => {
      if (done) return;
      if (sessionEmail) {
        done = true;
        setEmail(sessionEmail);
        setStatus("ready");
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      apply(data.session?.user.email);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session?.user.email);
    });

    const timeout = window.setTimeout(() => {
      if (!done) {
        done = true;
        setStatus("invalid");
      }
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const criteria = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      digit: /\d/.test(password),
      match: password.length > 0 && password === confirm,
    };
  }, [password, confirm]);

  const allValid = Object.values(criteria).every(Boolean);

  const mapErr = (err?: { message?: string | null; code?: string | null } | null) => {
    const msg = (err?.message ?? "").toLowerCase();
    const code = (err?.code ?? "").toLowerCase();
    if (code === "weak_password" || msg.includes("weak") || msg.includes("pwned")) return t("auth.errors.weakPassword");
    if (msg.includes("rate limit") || msg.includes("too many")) return t("auth.errors.rateLimit");
    if (msg.includes("network") || msg.includes("fetch")) return t("auth.errors.network");
    return err?.message || t("auth.errors.generic");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid || status !== "ready") return;
    setStatus("submitting");

    const { error: pwErr } = await supabase.auth.updateUser({ password });
    if (pwErr) {
      toast.error(mapErr(pwErr));
      setStatus("ready");
      return;
    }

    const { error: brandErr } = await supabase
      .from("brands")
      .update({ status: "active" })
      .eq("e_mail_address", email);
    if (brandErr) {
      toast.error(brandErr.message);
      setStatus("ready");
      return;
    }

    toast.success(t("welcome.success"));
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="text-center mb-6">
          <img src={logo} alt="winfluence" className="h-8 w-auto mx-auto" />
          <h1 className="mt-3 text-xl font-semibold">{t("welcome.title")}</h1>
        </div>

        {status === "loading" && (
          <p className="text-sm text-muted-foreground text-center py-8">{t("welcome.processing")}</p>
        )}

        {status === "invalid" && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
            {t("welcome.invalidLink")}
          </div>
        )}

        {(status === "ready" || status === "submitting") && (
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("welcome.intro")}</p>

            <div className="grid gap-2">
              <Label htmlFor="wemail">{t("auth.email")}</Label>
              <Input id="wemail" type="email" value={email} readOnly disabled />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="wpassword">{t("auth.password")}</Label>
              <Input
                id="wpassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="wconfirm">{t("auth.passwordConfirm")}</Label>
              <Input
                id="wconfirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="w-show-password"
                  checked={showPassword}
                  onCheckedChange={(v) => setShowPassword(Boolean(v))}
                />
                <Label htmlFor="w-show-password" className="text-sm font-normal cursor-pointer">
                  {t("auth.showPassword")}
                </Label>
              </div>
            </div>

            <ul className="space-y-1 text-sm">
              <CriterionItem ok={criteria.length} label={t("welcome.criteria.length")} />
              <CriterionItem ok={criteria.upper} label={t("welcome.criteria.upper")} />
              <CriterionItem ok={criteria.lower} label={t("welcome.criteria.lower")} />
              <CriterionItem ok={criteria.digit} label={t("welcome.criteria.digit")} />
              <CriterionItem ok={criteria.match} label={t("welcome.criteria.match")} />
            </ul>

            <Button type="submit" className="w-full" disabled={!allValid || status === "submitting"}>
              {t("welcome.submit")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function CriterionItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? "text-foreground" : "text-muted-foreground"}`}>
      {ok ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4" />}
      <span>{label}</span>
    </li>
  );
}
