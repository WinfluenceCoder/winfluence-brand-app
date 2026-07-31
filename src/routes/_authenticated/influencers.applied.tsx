import { createFileRoute } from "@tanstack/react-router";
import { CreatorsListPage } from "@/components/app/CreatorsListPage";
import { creatorsListQueryOptions } from "@/lib/creators-list";

export const Route = createFileRoute("/_authenticated/influencers/applied")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      creatorsListQueryOptions({ status: ["applied"], brandScoped: true }),
    ),
  component: () => (
    <CreatorsListPage
      titleKey="creatorsList.titleApplied"
      statuses={["applied"]}
      brandScoped
    />
  ),
});
