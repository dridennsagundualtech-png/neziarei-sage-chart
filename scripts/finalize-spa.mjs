// Flattens the SPA build output into ./dist so Capacitor (webDir: "dist") can use it.
// The Vite/TanStack SPA build emits dist/client (static assets + prerendered HTML)
// and dist/server (unused for a static app). This moves client -> dist root,
// guarantees an index.html SPA fallback, and drops the server bundle.
import { cp, rm, readdir, access, copyFile } from "node:fs/promises";
import { join } from "node:path";

const dist = "dist";
const client = join(dist, "client");
const server = join(dist, "server");

try {
  await access(client);
} catch {
  console.error("[finalize-spa] dist/client not found — run the SPA build first.");
  process.exit(1);
}

const entries = await readdir(client);
for (const entry of entries) {
  await rm(join(dist, entry), { recursive: true, force: true });
  await cp(join(client, entry), join(dist, entry), { recursive: true });
}

await rm(client, { recursive: true, force: true });
await rm(server, { recursive: true, force: true });

try {
  await access(join(dist, "index.html"));
} catch {
  // No prerendered "/" document: use the app shell as the SPA entry document.
  await copyFile(join(dist, "_shell.html"), join(dist, "index.html"));
}

console.log("[finalize-spa] static SPA ready in ./dist");
