import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Hash URLs (#/rosary) work from the phone's local files without a web server.
export const getRouter = () =>
  createRouter({
    routeTree,
    history: createHashHistory(),
    context: { queryClient: new QueryClient() },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
