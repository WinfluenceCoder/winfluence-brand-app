import { createFileRoute } from "@tanstack/react-router";
import { CreatorsListPage } from "@/components/app/CreatorsListPage";
import { creatorsListQueryOptions } from "@/lib/creators-list";

export const Route = createFileRoute("/_authenticated/influencers/hired")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      creatorsListQueryOptions({ status: ["hired"], brandScoped: true }),
    ),
  component: () => (
    <CreatorsListPage
      titleKey="creatorsList.titleHired"
      statuses={["hired"]}
      brandScoped
    />
  ),
});
