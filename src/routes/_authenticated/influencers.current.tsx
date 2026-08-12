import { createFileRoute } from "@tanstack/react-router";
import { CreatorsListPage } from "@/components/app/CreatorsListPage";
import { creatorsListQueryOptions } from "@/lib/creators-list";

export const Route = createFileRoute("/_authenticated/influencers/current")({
  loader: ({ context }) => {
    void context.queryClient
      .prefetchQuery(
        creatorsListQueryOptions({
          status: ["applied", "selected", "hired", "working", "delivered"],
        }),
      )
      .catch(() => {});
  },
  component: () => (
    <CreatorsListPage
      titleKey="creatorsList.titleCurrent"
      statuses={["applied", "selected", "hired", "working", "delivered"]}
    />
  ),
});
