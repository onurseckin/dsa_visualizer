import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/")({
  // Static default: hooks are unavailable in beforeLoad, and navbar-driven
  // navigation supplies the persisted lastItemId itself.
  beforeLoad: () => {
    throw redirect({ to: "/workspace/$algorithmId", params: { algorithmId: "bubble-sort" } });
  },
});
