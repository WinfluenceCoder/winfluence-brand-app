import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignsTable } from "@/components/app/CampaignsTable";
import {
  CAMPAIGN_STATUSES,
  type CampaignStatus,
  campaignsListQueryOptions,
} from "@/lib/campaigns-list";

const searchSchema = z.object({
  status: fallback(z.string(), "all").default("all"),
});

function normalizeStatus(raw: string): "all" | CampaignStatus {
  return (CAMPAIGN_STATUSES as readonly string[]).includes(raw)
    ? (raw as CampaignStatus)
    : "all";
}

export const Route = createFileRoute("/_authenticated/campaigns/")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ status: normalizeStatus(search.status) }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      campaignsListQueryOptions(
        deps.status === "all" ? {} : { status: deps.status },
      ),
    ),
  component: CampaignsListPage,
});

function CampaignsListPage() {
  const { t } = useTranslation();
  const rawSearch = Route.useSearch();
  const status = normalizeStatus(rawSearch.status);
  const navigate = useNavigate({ from: "/campaigns" });

  const { data } = useSuspenseQuery(
    campaignsListQueryOptions(status === "all" ? {} : { status }),
  );

  const setStatus = (next: string) => {
    navigate({ search: (prev: { status: string }) => ({ ...prev, status: next }) });
  };

  return (
    <div className="p-8">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("campaignsList.title")}
        </h1>
        <Button asChild>
          <Link to="/campaigns/new">
            <Plus className="h-4 w-4 mr-1" /> {t("home.newCampaign")}
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <CampaignsTable
          rows={data}
          statusFilter={{ value: status, onChange: setStatus }}
        />
        {data.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <p>{t("campaignsList.emptyForFilter")}</p>
            {status !== "all" && (
              <button
                type="button"
                onClick={() => setStatus("all")}
                className="mt-2 text-primary underline underline-offset-4"
              >
                {t("campaignsList.showAll")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
