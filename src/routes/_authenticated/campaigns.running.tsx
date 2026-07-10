import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/Placeholder";

export const Route = createFileRoute("/_authenticated/campaigns/running")({
  component: () => <Placeholder titleKey="placeholders.campaignsRunning" />,
});
