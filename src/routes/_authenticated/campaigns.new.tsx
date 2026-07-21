import { createFileRoute } from "@tanstack/react-router";
import { CampaignForm } from "@/components/app/CampaignForm";

export const Route = createFileRoute("/_authenticated/campaigns/new")({
  component: () => <CampaignForm mode="create" />,
});
