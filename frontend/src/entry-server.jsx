import React from "react";
import { renderToString } from "react-dom/server";
import App from "./AppShell.jsx";
import { ServerLocationContext } from "./utils/ServerLocationContext.jsx";
import { ServerMetadataContext } from "./utils/pageMetadata.js";
import { PrerenderedStudiosContext } from "./utils/publicStudio.js";
import { studioRegistry } from "./pages/studios";

/** Studior med egen sida eller tema. prerender.mjs prerendrar dem även om de inte står i katalogen. */
export const customStudioSlugs = Object.keys(studioRegistry);

/**
 * Sidans HTML plus metadatan den satte (se usePageMetadata och useJsonLd).
 * `studios` är studiodata som prerender.mjs hämtade vid bygget, per slug, så
 * att studiosidorna renderas med innehåll i stället för i laddningsläget.
 */
export function render(pathname, { studios = null } = {}) {
  const location = { pathname, search: "", hash: "" };
  const metadata = {};
  const html = renderToString(
    <ServerLocationContext.Provider value={location}>
      <ServerMetadataContext.Provider value={metadata}>
        <PrerenderedStudiosContext.Provider value={studios}>
          <App />
        </PrerenderedStudiosContext.Provider>
      </ServerMetadataContext.Provider>
    </ServerLocationContext.Provider>
  );
  return { html, metadata };
}
