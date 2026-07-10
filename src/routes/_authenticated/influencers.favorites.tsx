import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/Placeholder";

export const Route = createFileRoute("/_authenticated/influencers/favorites")({
  component: () => <Placeholder titleKey="placeholders.influencersFavorites" />,
});
