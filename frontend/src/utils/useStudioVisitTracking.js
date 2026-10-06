import { useEffect, useRef } from "react";
import { recordStudioVisit } from "../services/publicSiteApi";
import { isFirstStudioVisitInSession } from "./tracking";
import { getEntryReferrer } from "../i18n/languagePreference";

/**
 * Räknar ett besök på en studios publika sida.
 *
 * Ligger i AppShell och inte i sidkomponenterna med flit: studiosidan renderas
 * av två komponenter (StudioProfilePage och ThemedStudioPage för studios med
 * eget tema) och mätningen får inte hamna i bara den ena.
 *
 * Effekten körs bara i webbläsaren, så SSR-renderingar räknas inte.
 */
export function useStudioVisitTracking(slug) {
  const trackedSlug = useRef("");

  useEffect(() => {
    if (!slug || trackedSlug.current === slug) return;
    trackedSlug.current = slug;

    const url = new URL(window.location.href);
    recordStudioVisit(slug, {
      utmSource: url.searchParams.get("utm_source") || "",
      referrerUrl: getEntryReferrer(),
      firstInSession: isFirstStudioVisitInSession(slug)
    });
  }, [slug]);
}
