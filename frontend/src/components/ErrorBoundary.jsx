import { Component } from "react";
import { splitLanguageFromPath } from "../i18n/config";
import { createTranslator } from "../i18n/translate";

// Felgränsen ligger utanför LanguageProvider (se main.jsx), så språket läses
// ur adressen på samma sätt som appen gör.
function translatorForCurrentPage() {
  const pathname = typeof window === "undefined" ? "/" : window.location.pathname;
  return createTranslator(splitLanguageFromPath(pathname).language);
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary fångade ett fel:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { t } = translatorForCurrentPage();

      return (
        <div className="error-boundary" role="alert">
          <h2>{t("errorBoundary.title")}</h2>
          <p>{t("errorBoundary.text")}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            {t("errorBoundary.reload")}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
