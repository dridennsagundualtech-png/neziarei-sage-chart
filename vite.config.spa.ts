// Static SPA build config — used by `bun run build:spa` for the Capacitor/Android wrapper.
// Differences from vite.config.ts:
//   - TanStack Start runs in SPA mode (client-only shell, no SSR at runtime)
//   - nitro is disabled (no server bundle / Cloudflare worker output)
//   - the static client output is emitted so it can be collected into ./dist
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: false,
  tanstackStart: {
    spa: { enabled: true },
    prerender: { enabled: true },
    server: { entry: "server" },
  },
});
