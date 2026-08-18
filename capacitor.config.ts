import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.chartpilot",
  appName: "ChartPilot",
  // Static SPA output produced by `bun run build:spa`.
  webDir: "dist",
  android: {
    // Serve the bundled web assets over https://localhost so browser APIs
    // (localStorage, crypto, camera/file pickers) behave like on the web.
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
