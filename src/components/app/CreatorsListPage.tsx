import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CreatorsTable } from "@/components/app/CreatorsTable";
import { creatorsListQueryOptions } from "@/lib/creators-list";

type Props = {
  titleKey: string;
  statuses: readonly string[];
  brandScoped?: boolean;
};

export function CreatorsListPage({ titleKey, statuses, brandScoped }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState("all");

  const { data } = useSuspenseQuery(
    creatorsListQueryOptions({ status: statuses, brandScoped }),
  );

  const rows = status === "all" ? data : data.filter((r) => r.collabStatus === status);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t(titleKey)}</h1>

      <div className="mt-6">
        <CreatorsTable
          rows={rows}
          statusFilter={
            statuses.length > 1 ? { value: status, onChange: setStatus } : undefined
          }
        />
        {rows.length === 0 && (
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
        )}
      </div>
    </div>
  );
}
