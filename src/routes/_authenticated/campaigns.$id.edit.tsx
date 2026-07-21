import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyCampaign } from "@/lib/campaigns.functions";
import { CampaignForm } from "@/components/app/CampaignForm";

export const Route = createFileRoute("/_authenticated/campaigns/$id/edit")({
  component: EditCampaignPage,
});

function EditCampaignPage() {
  const { id } = Route.useParams();
  const fetchCampaign = useServerFn(getMyCampaign);
  const campaignId = Number(id);
  const { data } = useSuspenseQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => fetchCampaign({ data: { id: campaignId } }),
  });
  return <CampaignForm mode="edit" initial={data as never} />;
}
