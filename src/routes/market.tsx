import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The admin market analysis now lives on Analyze › Market data. Old links
 * (bookmarks, saved backtests) land there with their symbol and timeframes.
 */
export const Route = createFileRoute("/market")({
  beforeLoad: ({ location }) => {
    const params = new URLSearchParams(location.searchStr);
    params.set("mode", "data");
    throw redirect({ href: `/analyze?${params.toString()}` });
  },
});
