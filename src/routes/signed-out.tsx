import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import logo from "@/assets/winfluence-logo.png.asset.json";


export const Route = createFileRoute("/signed-out")({
  component: SignedOutPage,
});

function SignedOutPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="text-center max-w-md">
        <div className="text-2xl font-bold text-primary tracking-tight">winfluence</div>
        <h1 className="mt-6 text-xl font-semibold">{t("auth.signedOutTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("auth.signedOutSub")}</p>
        <Button asChild className="mt-6">
          <Link to="/login">{t("auth.backToLogin")}</Link>
        </Button>
      </div>
    </div>
  );
}
