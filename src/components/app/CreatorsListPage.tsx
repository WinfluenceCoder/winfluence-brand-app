import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { CreatorsTable } from "@/components/app/CreatorsTable";
import { creatorsListQueryOptions } from "@/lib/creators-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  titleKey: string;
  statuses: readonly string[];
  brandScoped?: boolean;
};

export function CreatorsListPage({ titleKey, statuses, brandScoped }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState("all");

  const { data, isLoading, error, refetch, isFetching } = useQuery(
    creatorsListQueryOptions({ status: statuses, brandScoped }),
  );

  const list = data ?? [];
  const rows = status === "all" ? list : list.filter((r) => r.collabStatus === status);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t(titleKey)}</h1>

      {error ? (
        <Card className="mt-6 border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              {t("creatorsList.errorTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-line break-words font-mono text-xs text-muted-foreground">
              {error instanceof Error ? error.message : String(error)}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {t("creatorsList.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6">
          <CreatorsTable
            rows={rows}
            statusFilter={
              statuses.length > 1 ? { value: status, onChange: setStatus } : undefined
            }
          />
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("creatorsList.loading")}
            </div>
          ) : (
            rows.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <p>{t("creatorsList.empty")}</p>
                {status !== "all" && (
                  <button
                    type="button"
                    onClick={() => setStatus("all")}
                    className="mt-2 text-primary underline underline-offset-4"
                  >
                    {t("creatorsList.showAll")}
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
