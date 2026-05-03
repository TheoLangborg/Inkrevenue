import React from "react";
import { renderToString } from "react-dom/server";
import App from "./AppShell.jsx";
import { ServerLocationContext } from "./utils/ServerLocationContext.jsx";

export function render(pathname) {
  const location = { pathname, search: "", hash: "" };
  return renderToString(
    <ServerLocationContext.Provider value={location}>
      <App />
    </ServerLocationContext.Provider>
  );
}
