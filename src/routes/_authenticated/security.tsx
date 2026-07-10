import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const { t } = useTranslation();
  const { user } = Route.useRouteContext();
  const [busy, setBusy] = useState(false);

  const handleReset = async () => {
    if (!user.email) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(t("auth.errors.generic"));
      return;
    }
    toast.success(t("security.resetSent"));
  };

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">{t("security.title")}</h1>
      <div className="mt-8 space-y-6">
        <div className="grid gap-2">
          <Label>{t("security.emailLabel")}</Label>
          <Input value={user.email ?? ""} disabled />
        </div>
        <Button onClick={handleReset} disabled={busy}>
          {t("security.resetButton")}
        </Button>
      </div>
    </div>
  );
}
