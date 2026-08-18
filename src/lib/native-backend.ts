/**
 * Native (Capacitor) backend routing.
 *
 * In the browser the app and its server functions share one origin, so every
 * request can stay relative. Inside the Android APK the web assets are served
 * from `https://localhost`, which has no server behind it — so server function
 * and API calls must be pointed at the hosted backend instead.
 *
 * This module rewrites those calls to an absolute backend URL, but only when
 * the app is actually running natively.
 */

/** Origins the Capacitor WebView can use for the bundled assets. */
export const NATIVE_WEBVIEW_ORIGINS = [
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
  "ionic://localhost",
] as const;

/** Absolute backend used by the native app. Override with VITE_NATIVE_BACKEND_URL. */
export const NATIVE_BACKEND_URL = (
  (import.meta.env.VITE_NATIVE_BACKEND_URL as string | undefined) ??
  "https://chart-oracle-28.lovable.app"
).replace(/\/+$/, "");

/** Paths that must reach the real server (server functions + API routes). */
const SERVER_PATH_PREFIXES = ["/_serverFn", "/api/"];

function isServerPath(pathname: string) {
  return SERVER_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** True when running inside the Capacitor Android/iOS WebView. */
export function isNativeRuntime(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

/** Absolute URL for a server path when native; unchanged relative path on the web. */
export function backendUrl(path: string): string {
  if (!isNativeRuntime()) return path;
  return `${NATIVE_BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

let installed = false;

/**
 * Patch `window.fetch` so server-function / API requests go to the hosted
 * backend when running natively. Call once, from a client effect.
 */
export function installNativeBackendFetch(): void {
  if (installed || typeof window === "undefined") return;
  if (!isNativeRuntime()) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const requestUrl =
        typeof input === "string"
          ? new URL(input, window.location.href)
          : input instanceof URL
            ? input
            : new URL(input.url);

      const sameOrigin = requestUrl.origin === window.location.origin;
      if (sameOrigin && isServerPath(requestUrl.pathname)) {
        const target = new URL(
          requestUrl.pathname + requestUrl.search + requestUrl.hash,
          NATIVE_BACKEND_URL,
        );

        if (typeof input === "string" || input instanceof URL) {
          return originalFetch(target.toString(), { ...init, mode: "cors", credentials: "omit" });
        }

        // Request instance: rebuild it against the absolute URL.
        const cloned = new Request(target.toString(), input);
        return originalFetch(cloned, { ...init, mode: "cors", credentials: "omit" });
      }
    } catch {
      // Fall through to the untouched fetch on any URL parsing problem.
    }

    return originalFetch(input as RequestInfo, init);
  };
}
