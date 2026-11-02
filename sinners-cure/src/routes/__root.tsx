import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useNavigate,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav, Toaster } from "@/components/app-ui";
import { useSettings } from "@/lib/settings";
import { getToday } from "@/lib/today";
import { useReminder } from "@/lib/reminder";
import { startNative } from "@/lib/native";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-4xl font-semibold text-foreground">Page not found</h1>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
          >
            Go to Today
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">This page didn't load</h1>
        <p className="mt-2 text-muted-foreground">Something went wrong. Try again.</p>
        <button
          onClick={() => {
            void router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { settings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    const h = document.documentElement;
    h.classList.toggle("dark", settings.theme === "dark");
    h.style.fontSize = `${settings.textScale * 100}%`;
  }, [settings.theme, settings.textScale]);

  useEffect(() => {
    document.documentElement.dataset["lit"] = getToday(new Date(), settings.calendar).color;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(settings.calendar)]);
  useEffect(() => {
    void startNative((to) => void navigate({ to }));
  }, [navigate]);
  useReminder(settings.reminder, settings.reminderFor);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
      <BottomNav />
    </QueryClientProvider>
  );
}
