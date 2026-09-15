// Samma utm-nycklar som CRM:ets ReferralLinkPanel delar ut och som
// besöksmätningen (studioLinkStatsService i tattoo-crm) bokför på.
const BIO_LINK_UTM_SOURCES = new Set([
  "instagram",
  "ig",
  "facebook",
  "fb",
  "tiktok",
  "tt",
  "social_media",
  "social",
  "inkrevenue"
]);

// Appernas inbyggda webbläsare. Fångar biolänkar som lagts in utan utm-parametrar.
const IN_APP_BROWSER_PATTERN = /instagram|FBAN|FBAV|FB_IAB|tiktok|musical_ly|BytedanceWebview/i;

function isSocialReferrer(referrer) {
  if (!referrer) return false;

  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return false;
  }

  return host.includes("instagram") || host.includes("facebook") || host.startsWith("fb.") || host.includes("tiktok");
}

/**
 * Kom besökaren via en länk studion delat — biolänken på Instagram, TikTok,
 * Facebook eller en av CRM:ets referral-länkar?
 *
 * Google, direkttrafik och studiokatalogen på vår egen sajt räknas inte: de
 * besökarna letar studio och ska få se sidan uppifrån.
 */
export function isBioLinkVisit({ search = "", referrer = "", userAgent = "" } = {}) {
  const utmSource = (new URLSearchParams(search).get("utm_source") || "").trim().toLowerCase();
  if (utmSource) return BIO_LINK_UTM_SOURCES.has(utmSource);

  return IN_APP_BROWSER_PATTERN.test(userAgent) || isSocialReferrer(referrer);
}
