import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { installNativeBackendFetch } from "./lib/native-backend";

export const getRouter = () => {
  // Native (Capacitor) builds must send server-function calls to the hosted
  // backend; install before any loader runs.
  installNativeBackendFetch();

  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
