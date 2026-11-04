import type { QueryClient } from "@tanstack/react-query";
import { LANG, t } from "@/lib/lang";
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
import { BottomNav, Toaster, NowReading } from "@/components/app-ui";
import { useSettings } from "@/lib/settings";
import { getToday } from "@/lib/today";
import { useReminder } from "@/lib/reminder";
import { startNative } from "@/lib/native";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-4xl font-semibold text-foreground">
          {t("Page not found", "Hindi makita ang pahina")}
        </h1>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
          >
            {t("Go to Today", "Pumunta sa Ngayon")}
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
        <h1 className="text-xl font-semibold text-foreground">
          {t("This page didn't load", "Hindi nag-load ang pahinang ito")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("Something went wrong. Try again.", "May nangyaring mali. Subukang muli.")}
        </p>
        <button
          onClick={() => {
            void router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
        >
          {t("Try again", "Subukang muli")}
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
    h.lang = LANG === "tl" ? "fil" : "en";
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
      <NowReading />
      <BottomNav />
    </QueryClientProvider>
  );
}
