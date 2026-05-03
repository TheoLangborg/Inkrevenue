/**
 * Post-build prerender script.
 * Reads dist/index.html (the Vite browser build output), SSR-renders each
 * static route into it, then writes the result as dist/<route>/index.html.
 * Vercel serves static files before the catch-all /index.html rewrite, so
 * crawlers and link-preview bots get fully-rendered HTML while the browser
 * JS bundle still hydrates normally.
 *
 * Run: node prerender.mjs  (called automatically by "postbuild" npm script)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "dist");
const serverEntry = path.resolve(distDir, "server", "entry-server.js");

const ROUTES = [
  "/",
  "/studios",
  "/faq",
  "/studio/royalkave",
];

async function main() {
  // Read the HTML shell produced by vite build
  const htmlShell = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");

  // Import the SSR bundle (pathToFileURL needed on Windows for ESM dynamic import)
  const { pathToFileURL } = await import("url");
  const { render } = await import(pathToFileURL(serverEntry).href);

  for (const route of ROUTES) {
    let appHtml;
    try {
      appHtml = render(route);
    } catch (err) {
      console.warn(`[prerender] Skipping ${route} — render threw:`, err.message);
      continue;
    }

    // Splice rendered HTML into the shell
    const html = htmlShell.replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`
    );

    // Write to dist/<route>/index.html
    let outDir;
    if (route === "/") {
      outDir = distDir;
    } else {
      outDir = path.join(distDir, route.slice(1).replace(/\//g, path.sep));
    }

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
    console.log(`[prerender] ✓ ${route}`);
  }

  console.log("[prerender] Done.");
}

main().catch((err) => {
  console.error("[prerender] Fatal:", err);
  process.exit(1);
});
