import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/messages/system")({
  beforeLoad: () => {
    throw redirect({ to: "/messages", search: { type: "moderator", id: undefined } });
  },
  component: () => null,
});
