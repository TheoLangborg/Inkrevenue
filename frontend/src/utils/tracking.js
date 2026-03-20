export function getTrackingPayload() {
  if (typeof window === "undefined") {
    return {};
  }

  const currentUrl = new URL(window.location.href);

  return {
    pageUrl: currentUrl.toString(),
    referrerUrl: document.referrer || "",
    utmSource: currentUrl.searchParams.get("utm_source") || "",
    utmMedium: currentUrl.searchParams.get("utm_medium") || "",
    utmCampaign: currentUrl.searchParams.get("utm_campaign") || "",
    utmContent: currentUrl.searchParams.get("utm_content") || "",
    utmTerm: currentUrl.searchParams.get("utm_term") || "",
    gclid: currentUrl.searchParams.get("gclid") || "",
    fbclid: currentUrl.searchParams.get("fbclid") || ""
  };
}
