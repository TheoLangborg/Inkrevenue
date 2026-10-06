/**
 * Post-build prerender script.
 * Reads dist/index.html (the Vite browser build output), SSR-renders each
 * static route into it, then writes the result as dist/<route>/index.html.
 * Vercel serves static files before the catch-all /index.html rewrite, so
 * crawlers and link-preview bots get fully-rendered HTML while the browser
 * JS bundle still hydrates normally.
 *
 * Varje rutt prerendras i båda språken: svenska på "/" och engelska på "/en".
 * Per rutt skrivs också <html lang>, canonical, hreflang och og:locale om, så
 * att crawlers ser rätt språksignaler redan i den statiska HTML:en (den JS-satta
 * versionen i pageMetadata.js hinner de inte alltid vänta på).
 *
 * Run: node prerender.mjs  (called automatically by "postbuild" npm script)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "dist");
const serverEntry = path.resolve(distDir, "server", "entry-server.js");

const SITE_URL = "https://inkrevenue.online";

// Språkfria rutter — varje post prerendras en gång per språk nedan.
const ROUTES = [
  "/",
  "/studios",
  "/faq",
  "/testa-gratis",
  "/integritetspolicy",
  "/anvandarvillkor",
  "/studio/royalkave",
];

// Måste spegla src/i18n/config.js.
const LANGUAGES = ["sv", "en"];
const DEFAULT_LANGUAGE = "sv";
const HTML_LANG = { sv: "sv-SE", en: "en" };
const OG_LOCALES = { sv: "sv_SE", en: "en_GB" };

function localizeRoute(route, language) {
  if (language === DEFAULT_LANGUAGE) return route;
  return route === "/" ? "/en" : `/${language}${route}`;
}

/**
 * Byter ut språkberoende head-taggar i shellen mot ruttens egna.
 * Shellen innehåller startsidans svenska taggar — utan det här skulle varje
 * prerendrad sida påstå sig vara den svenska startsidan.
 */
function applyLanguageHead(html, route, language) {
  const canonical = `${SITE_URL}${localizeRoute(route, language)}`;
  const alternates = [
    ...LANGUAGES.map(
      (code) =>
        `<link rel="alternate" href="${SITE_URL}${localizeRoute(route, code)}" hreflang="${HTML_LANG[code]}" />`
    ),
    `<link rel="alternate" href="${SITE_URL}${localizeRoute(route, DEFAULT_LANGUAGE)}" hreflang="x-default" />`,
  ].join("\n    ");

  return html
    .replace(/<html lang="[^"]*"/, `<html lang="${HTML_LANG[language]}"`)
    .replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${canonical}" />`
    )
    .replace(/<link rel="alternate" href="[^"]*" hreflang="[^"]*" \/>/, alternates)
    .replace(
      /<meta property="og:locale"\s+content="[^"]*" \/>/,
      `<meta property="og:locale"      content="${OG_LOCALES[language]}" />`
    )
    .replace(
      /<meta property="og:url"\s+content="[^"]*" \/>/,
      `<meta property="og:url"         content="${canonical}" />`
    );
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Sidans egen titel och beskrivning (som usePageMetadata satte under
 * renderingen) i stället för startsidans svenska. Länkförhandsvisare kör inte
 * JavaScript, så utan det här visade en delad /en-länk svensk text.
 *
 * Studiosidor hoppas över: de prerendras i laddningsläget, innan studion
 * hämtats, och har därför ingen riktig titel att skriva in.
 */
function applyPageMetadata(html, route, metadata) {
  if (route.startsWith("/studio/") || !metadata?.title) return html;

  const title = escapeAttribute(metadata.title);
  const description = metadata.description ? escapeAttribute(metadata.description) : "";
  // Funktioner som ersättning: en titel med "$" ska inte tolkas som mönster.
  const setContent = (source, pattern, value) =>
    source.replace(pattern, (match, start, end) => `${start}${value}${end}`);

  let next = html.replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`);
  next = setContent(next, /(<meta property="og:title"\s+content=")[^"]*(" \/>)/, title);
  next = setContent(next, /(<meta name="twitter:title"\s+content=")[^"]*(" \/>)/, title);
  next = setContent(next, /(<meta property="og:image:alt"\s+content=")[^"]*(" \/>)/, title);

  if (description) {
    next = setContent(next, /(<meta name="description" content=")[^"]*(" \/>)/, description);
    next = setContent(next, /(<meta property="og:description" content=")[^"]*(" \/>)/, description);
    next = setContent(next, /(<meta name="twitter:description" content=")[^"]*(" \/>)/, description);
  }

  return next;
}

async function main() {
  // Read the HTML shell produced by vite build
  const htmlShell = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");

  // Guard: körs skriptet en andra gång är dist/index.html redan den
  // prerendrade startsidan — då skulle alla rutter skrivas med fel innehåll.
  if (!htmlShell.includes('<div id="root"></div>')) {
    console.error(
      "[prerender] dist/index.html är inte den orörda Vite-shellen (root-diven är inte tom). Kör om 'npm run build'."
    );
    process.exit(1);
  }

  for (const language of LANGUAGES) {
    for (const route of ROUTES) {
      const localizedRoute = localizeRoute(route, language);
      let appHtml;
      let metadata;

      try {
        // Import the SSR bundle (pathToFileURL needed on Windows for ESM dynamic import)
        const { pathToFileURL } = await import("url");
        const { render } = await import(pathToFileURL(serverEntry).href);
        ({ html: appHtml, metadata } = render(localizedRoute));
      } catch (err) {
        console.warn(`[prerender] Skipping ${localizedRoute} — render threw:`, err.message);
        continue;
      }

      // Splice rendered HTML into the shell + sätt ruttens språksignaler,
      // titel och beskrivning
      const html = applyPageMetadata(applyLanguageHead(htmlShell, route, language), route, metadata).replace(
        '<div id="root"></div>',
        () => `<div id="root">${appHtml}</div>`
      );

      // Write to dist/<route>/index.html
      let outDir;
      if (localizedRoute === "/") {
        outDir = distDir;
      } else {
        outDir = path.join(distDir, localizedRoute.slice(1).replace(/\//g, path.sep));
      }

      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
      console.log(`[prerender] ✓ ${localizedRoute}`);
    }
  }

  console.log("[prerender] Done.");
}

main().catch((err) => {
  console.error("[prerender] Fatal:", err);
  process.exit(1);
});
