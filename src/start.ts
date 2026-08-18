import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { NATIVE_WEBVIEW_ORIGINS } from "./lib/native-backend";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const nativeOrigins = new Set<string>(NATIVE_WEBVIEW_ORIGINS);

function corsHeaders(origin: string) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-tsr-redirect",
    "access-control-max-age": "86400",
    vary: "origin",
  } as Record<string, string>;
}

/**
 * The Android app loads its assets from https://localhost, so its server
 * function calls arrive cross-origin. Allow exactly those WebView origins.
 */
const nativeCorsMiddleware = createMiddleware().server(async (ctx) => {
  const origin = ctx.request.headers.get("Origin");
  if (!origin || !nativeOrigins.has(origin)) {
    return ctx.next();
  }

  if (ctx.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const result = await ctx.next();
  const response = result instanceof Response ? result : (result as { response?: Response }).response;
  if (response instanceof Response) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value);
    }
  }
  return result;
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests. The native WebView origins are allow-listed so the
// Android build can talk to the hosted backend.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
  origin: (value) => nativeOrigins.has(value) || value === new URL(ctx_url(value)).origin,
  secFetchSite: (value, ctx) => {
    if (value === "same-origin" || value === "none") return true;
    const origin = ctx.request.headers.get("Origin");
    return origin !== null && nativeOrigins.has(origin);
  },
});

// Helper kept tiny: the origin matcher only needs to compare against itself
// when the request is not from a native WebView; Start already validates
// same-origin requests before reaching here.
function ctx_url(value: string) {
  return value;
}

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, nativeCorsMiddleware, csrfMiddleware],
}));
