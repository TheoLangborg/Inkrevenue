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
 * Studiosidorna renderas med riktig data: studiorna hämtas från det publika
 * API:t vid bygget (katalogens studior plus de med egen sidkomponent). Svarar
 * API:t inte prerendras de inte alls, och reservsidan tar över (se nedan).
 *
 * Skriptet skriver också:
 *  - app.html: den orörda shellen utan canonical/hreflang. vercel.json skickar
 *    sajtens dynamiska vägar (betallänkar, nya studiosidor m.m.) hit, så att
 *    de inte längre får startsidans HTML med canonical till startsidan.
 *  - 404.html: samma shell. Vercel svarar med den och status 404 för okända
 *    adresser (förut svarade allt 200 med startsidan). Appen ritar ändå rätt
 *    sida utifrån adressen, så en väg som saknas i vercel.json syns fortfarande
 *    för besökaren, bara med fel statuskod.
 *  - sitemap.xml: varje prerendrad sida som ska indexeras, med hreflang.
 *
 * Run: node prerender.mjs  (called automatically by "postbuild" npm script)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { TEST_STUDIO_SLUGS } from "./src/utils/studioOrder.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "dist");
const serverEntry = path.resolve(distDir, "server", "entry-server.js");

// Speglar SITE_URL i src/utils/pageMetadata.js. Apex 308:ar till www.
const SITE_URL = "https://www.inkrevenue.online";

// Varifrån studiorna hämtas vid bygget. Samma publika API som sajten använder.
const API_BASE = process.env.PRERENDER_API_BASE || SITE_URL;
const API_TIMEOUT_MS = 15000;

// Språkfria rutter — varje post prerendras en gång per språk nedan.
// Studiosidorna läggs till av loadStudios().
const ROUTES = [
  "/",
  "/studios",
  "/faq",
  "/testa-gratis",
  "/bokningssystem-for-tatuerare",
  "/marknadsforing-for-tatueringsstudior",
  "/integritetspolicy",
  "/anvandarvillkor",
];

// Prioritet i sitemapen. Saknas rutten här gäller 0.5 (studiosidor 0.7).
const SITEMAP_PRIORITY = {
  "/": "1.0",
  "/studios": "0.8",
  "/testa-gratis": "0.8",
  "/bokningssystem-for-tatuerare": "0.9",
  "/marknadsforing-for-tatueringsstudior": "0.9",
  "/faq": "0.6",
  "/integritetspolicy": "0.2",
  "/anvandarvillkor": "0.2",
};

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
 *
 * hreflang-taggarna märks data-i18n-alt som de pageMetadata.js skapar, så att
 * appen byter ut dem i stället för att lägga en uppsättning till.
 */
function applyLanguageHead(html, route, language) {
  const canonical = `${SITE_URL}${localizeRoute(route, language)}`;
  const alternates = [
    ...LANGUAGES.map(
      (code) =>
        `<link rel="alternate" href="${SITE_URL}${localizeRoute(route, code)}" hreflang="${HTML_LANG[code]}" data-i18n-alt="1" />`
    ),
    `<link rel="alternate" href="${SITE_URL}${localizeRoute(route, DEFAULT_LANGUAGE)}" hreflang="x-default" data-i18n-alt="1" />`,
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
 */
function applyPageMetadata(html, route, metadata) {
  if (!metadata?.title) return html;

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

  if (metadata.noIndex) {
    next = setContent(next, /(<meta name="robots" content=")[^"]*(" \/>)/, "noindex, nofollow");
  }

  return next;
}

/** JSON i en <script>: "<" kodas så att "</script>" i en text inte avslutar taggen. */
function serializeForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Sidans schema (useJsonLd) och, på studiosidor, studiodatan som appen startar
 * med (se src/utils/publicStudio.js). Schemat märks data-prerendered: main.jsx
 * tar bort det innan appen lägger in sitt eget, så att det inte finns två av
 * varje.
 */
function applyHeadScripts(html, { jsonLd = [], studio = null }) {
  const scripts = [
    ...jsonLd.map(
      (schema) => `<script type="application/ld+json" data-prerendered>${serializeForScript(schema)}</script>`
    ),
    studio ? `<script>window.__PRERENDERED_STUDIO__=${serializeForScript(studio)}</script>` : "",
  ].filter(Boolean);

  if (!scripts.length) return html;
  return html.replace("</head>", () => `  ${scripts.join("\n    ")}\n  </head>`);
}

/**
 * Shellen för vägar som inte prerendras: utan canonical, hreflang och og:url,
 * som annars påstod att sidan var startsidan. Appen sätter dem själv.
 */
function buildAppShell(htmlShell) {
  return htmlShell
    .replace(/\s*<link rel="canonical" href="[^"]*" \/>/, "")
    .replace(/\s*<link rel="alternate" href="[^"]*" hreflang="[^"]*" \/>/, "")
    .replace(/\s*<meta property="og:url"\s+content="[^"]*" \/>/, "");
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    return payload?.data ?? payload;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Studiorna att prerendra: katalogens (utom teststudion) och de som har en egen
 * sida i studioRegistry, så länge API:t lämnar ut dem. En dold studio svarar
 * 404 och prerendras därför aldrig. Fel stoppar inte bygget.
 */
async function loadStudios(customStudioSlugs) {
  const studios = {};
  let directorySlugs;

  try {
    const list = await fetchJson(`${API_BASE}/api/public/studios`);
    directorySlugs = (Array.isArray(list) ? list : []).map((studio) => studio?.slug).filter(Boolean);
  } catch (err) {
    console.warn(`[prerender] Kunde inte hämta studiolistan (${err.message}). Studiosidorna prerendras inte.`);
    return studios;
  }

  const slugs = [...new Set([...directorySlugs, ...customStudioSlugs])].filter(
    (slug) => !TEST_STUDIO_SLUGS.includes(slug)
  );

  for (const slug of slugs) {
    try {
      const studio = await fetchJson(`${API_BASE}/api/public/studios/${encodeURIComponent(slug)}`);
      if (studio?.slug === slug) studios[slug] = studio;
    } catch (err) {
      console.warn(`[prerender] Hoppar över /studio/${slug} (${err.message}).`);
    }
  }

  return studios;
}

function buildSitemap(routes) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const entries = routes.flatMap((route) => {
    const priority = SITEMAP_PRIORITY[route] || (route.startsWith("/studio/") ? "0.7" : "0.5");
    const alternates = [
      ...LANGUAGES.map(
        (code) =>
          `    <xhtml:link rel="alternate" hreflang="${HTML_LANG[code]}" href="${SITE_URL}${localizeRoute(route, code)}" />`
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${localizeRoute(route, DEFAULT_LANGUAGE)}" />`,
    ].join("\n");

    return LANGUAGES.map(
      (language) =>
        `  <url>\n    <loc>${SITE_URL}${localizeRoute(route, language)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority}</priority>\n${alternates}\n  </url>`
    );
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;
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

  // Import the SSR bundle (pathToFileURL needed on Windows for ESM dynamic import)
  const { render, customStudioSlugs } = await import(pathToFileURL(serverEntry).href);
  const studios = await loadStudios(customStudioSlugs);
  const routes = [...ROUTES, ...Object.keys(studios).map((slug) => `/studio/${slug}`)];
  // Antal språk där rutten renderades och får indexeras. Bara rutter med
  // båda språken kommer med i sitemapen (hreflang-paren måste finnas).
  const indexable = new Map(routes.map((route) => [route, 0]));

  for (const language of LANGUAGES) {
    for (const route of routes) {
      const localizedRoute = localizeRoute(route, language);
      const studioSlug = route.startsWith("/studio/") ? route.slice("/studio/".length) : null;
      let appHtml;
      let metadata;

      try {
        ({ html: appHtml, metadata } = render(localizedRoute, { studios }));
      } catch (err) {
        console.warn(`[prerender] Skipping ${localizedRoute} — render threw:`, err.message);
        continue;
      }

      // Splice rendered HTML into the shell + sätt ruttens språksignaler,
      // titel, beskrivning och schema
      const html = applyHeadScripts(
        applyPageMetadata(applyLanguageHead(htmlShell, route, language), route, metadata),
        { jsonLd: metadata?.jsonLd, studio: studioSlug ? studios[studioSlug] : null }
      ).replace('<div id="root"></div>', () => `<div id="root">${appHtml}</div>`);

      // Write to dist/<route>/index.html
      let outDir;
      if (localizedRoute === "/") {
        outDir = distDir;
      } else {
        outDir = path.join(distDir, localizedRoute.slice(1).replace(/\//g, path.sep));
      }

      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
      if (!metadata?.noIndex) indexable.set(route, indexable.get(route) + 1);
      console.log(`[prerender] ✓ ${localizedRoute}`);
    }
  }

  const appShell = buildAppShell(htmlShell);
  fs.writeFileSync(path.join(distDir, "app.html"), appShell, "utf-8");
  fs.writeFileSync(path.join(distDir, "404.html"), appShell, "utf-8");
  console.log("[prerender] ✓ app.html, 404.html");

  const sitemapRoutes = [...indexable]
    .filter(([, count]) => count === LANGUAGES.length)
    .map(([route]) => route);
  fs.writeFileSync(path.join(distDir, "sitemap.xml"), buildSitemap(sitemapRoutes), "utf-8");
  console.log(`[prerender] ✓ sitemap.xml (${sitemapRoutes.length * LANGUAGES.length} adresser)`);

  console.log("[prerender] Done.");
}

main().catch((err) => {
  console.error("[prerender] Fatal:", err);
  process.exit(1);
});
