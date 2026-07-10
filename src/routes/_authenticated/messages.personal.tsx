import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/Placeholder";

export const Route = createFileRoute("/_authenticated/messages/personal")({
  component: () => <Placeholder titleKey="placeholders.messagesPersonal" />,
});
