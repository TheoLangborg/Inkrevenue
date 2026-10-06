import { getEntryReferrer } from "../i18n/languagePreference";

const SESSION_STORAGE_KEY = "inkrevenue-session-id";

// Maps utm_source values from URLs to our internal billing source keys.
// "inkrevenue"   → direct booking link (e.g. studio bio, QR code we produced)
// "social_media" → post/DM we managed on their social accounts
// anything else  → leave empty, backend will default to inkrevenue_studio_page (non-billable)
const UTM_SOURCE_TO_LEAD_SOURCE = {
  inkrevenue: "inkrevenue",
  social_media: "social_media",
  instagram: "social_media",
  facebook: "social_media",
  tiktok: "social_media"
};

export function getLeadSourceFromUrl() {
  if (typeof window === "undefined") return "";
  const utmSource = new URL(window.location.href).searchParams
    .get("utm_source")
    ?.toLowerCase()
    ?.trim() || "";
  return UTM_SOURCE_TO_LEAD_SOURCE[utmSource] || "";
}

function createFallbackSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existingSessionId = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (existingSessionId) {
    return existingSessionId;
  }

  const nextSessionId = window.crypto?.randomUUID?.() || createFallbackSessionId();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
  return nextSessionId;
}

/**
 * Är det här första gången studiosidan öppnas i den här webbläsarsessionen?
 *
 * Ett klick på en biolänk öppnar en ny flik och ger därmed en ny session,
 * medan omladdning, språkbyte och navigering fram och tillbaka inte gör det.
 * Det är skillnaden mellan "antal klick" och "antal sidvisningar".
 */
export function isFirstStudioVisitInSession(slug) {
  if (typeof window === "undefined") return false;

  const key = `inkrevenue-studio-seen:${slug}`;
  try {
    if (window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.setItem(key, "1");
    return true;
  } catch {
    // Privat läge utan sessionStorage: räkna hellre besöket än att tappa det.
    return true;
  }
}

export function getTrackingPayload() {
  if (typeof window === "undefined") {
    return {};
  }

  const currentUrl = new URL(window.location.href);

  return {
    pageUrl: currentUrl.toString(),
    referrerUrl: getEntryReferrer(),
    utmSource: currentUrl.searchParams.get("utm_source") || "",
    utmMedium: currentUrl.searchParams.get("utm_medium") || "",
    utmCampaign: currentUrl.searchParams.get("utm_campaign") || "",
    utmContent: currentUrl.searchParams.get("utm_content") || "",
    utmTerm: currentUrl.searchParams.get("utm_term") || "",
    gclid: currentUrl.searchParams.get("gclid") || "",
    fbclid: currentUrl.searchParams.get("fbclid") || "",
    sessionId: getOrCreateSessionId()
  };
}
