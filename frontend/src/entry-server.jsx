import React from "react";
import { renderToString } from "react-dom/server";
import App from "./AppShell.jsx";
import { ServerLocationContext } from "./utils/ServerLocationContext.jsx";
import { ServerMetadataContext } from "./utils/pageMetadata.js";

/** Sidans HTML plus titeln och beskrivningen den satte (se usePageMetadata). */
export function render(pathname) {
  const location = { pathname, search: "", hash: "" };
  const metadata = {};
  const html = renderToString(
    <ServerLocationContext.Provider value={location}>
      <ServerMetadataContext.Provider value={metadata}>
        <App />
      </ServerMetadataContext.Provider>
    </ServerLocationContext.Provider>
  );
  return { html, metadata };
}
