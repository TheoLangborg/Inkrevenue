import React from "react";
import ReactDOM from "react-dom/client";
import App from "./AppShell.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { getEntryReferrer } from "./i18n/languagePreference";
import { isTestMode } from "./utils/testMode";
import "./App.css";

// Språkskriptet i index.html håller på att byta till samma sida på besökarens
// språk. Då renderas inget här: besöket skulle räknas två gånger, och sidan
// kunna synas på fel språk innan bytet.
if (!window.__inkrevenueLanguageRedirect) {
  // Före allt annat: hänvisaren som skriptet sparade innan det bytte adress.
  getEntryReferrer();
  // Likaså ?test: katalogen skriver om adressen med sina filter och tar då
  // bort den. Läst här sparas testläget för fliken innan något hinner det.
  isTestMode();
  // Schemat som prerenderingen skrev in. Sidorna lägger själva in sitt via
  // useJsonLd, så utan det här fanns varje schema två gånger.
  document.querySelectorAll('script[type="application/ld+json"][data-prerendered]').forEach((element) => element.remove());

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
