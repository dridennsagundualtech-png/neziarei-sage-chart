// Runs the static SPA build for the Android app, then exits.
// The prerender step leaves a handle open after it finishes, which makes
// `vite build` hang forever in CI; building through the API lets us exit
// as soon as the build (including prerender) has resolved.
import { createBuilder } from "vite";

try {
  // Same as `vite build`: every environment (client + SSR for prerender) and the app hooks.
  const builder = await createBuilder({ configFile: "vite.config.spa.ts" });
  await builder.buildApp();
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
