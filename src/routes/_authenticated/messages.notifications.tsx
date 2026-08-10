import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/messages/notifications")({
  beforeLoad: () => {
    throw redirect({ to: "/messages", search: { type: "system", id: undefined } });
  },
  component: () => null,
});
