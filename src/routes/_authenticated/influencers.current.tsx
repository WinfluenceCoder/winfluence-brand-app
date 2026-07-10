import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/Placeholder";

export const Route = createFileRoute("/_authenticated/influencers/current")({
  component: () => <Placeholder titleKey="placeholders.influencersCurrent" />,
});
