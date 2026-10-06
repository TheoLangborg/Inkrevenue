import React from "react";
import ReactDOM from "react-dom/client";
import App from "./AppShell.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { getEntryReferrer } from "./i18n/languagePreference";
import "./App.css";

// Språkskriptet i index.html håller på att byta till samma sida på besökarens
// språk. Då renderas inget här: besöket skulle räknas två gånger, och sidan
// kunna synas på fel språk innan bytet.
if (!window.__inkrevenueLanguageRedirect) {
  // Före allt annat: hänvisaren som skriptet sparade innan det bytte adress.
  getEntryReferrer();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
