import { pinStudiosFirst } from "../utils/studioOrder";
import { DEFAULT_LANGUAGE, splitLanguageFromPath } from "../i18n/config";
import { createTranslator } from "../i18n/translate";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function normalizeArrayPayload(payload) {
  return Array.isArray(payload) ? payload.filter(Boolean) : [];
}

function getTextErrorMessage(text) {
  const rawText = String(text || "").trim();

  if (!rawText) {
    return "";
  }

  const htmlPreMatch = rawText.match(/<pre>([\s\S]*?)<\/pre>/i);
  const htmlTitleMatch = rawText.match(/<title>([\s\S]*?)<\/title>/i);
  const candidate = htmlPreMatch?.[1] || htmlTitleMatch?.[1] || rawText;

  return candidate
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

/* eslint-disable-next-line no-unused-vars */
async function requestLegacy(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const isJsonResponse = contentType.includes("application/json");
  const payload = isJsonResponse ? await response.json().catch(() => null) : null;
  const textPayload = isJsonResponse ? "" : await response.text().catch(() => "");

  if (!response.ok) {
    throw new Error(payload?.message || "Något gick fel vid API-anropet.");
  }

  return payload?.data ?? payload;
}

/**
 * Serverns felmeddelanden (proxyn och CRM:et) finns bara på svenska. På andra
 * språk får felet därför ingen text, så att anroparen visar sin egen översatta
 * (`error.message || t(...)`). Vid 429 säger vi själva åt kunden att vänta.
 * `language` behövs bara där sidans språk inte står i adressen: betalsidan
 * följer bokningens språk.
 */
function getErrorMessage({ payload, textPayload, status, language }) {
  const pageLanguage =
    language ||
    (typeof window === "undefined"
      ? DEFAULT_LANGUAGE
      : splitLanguageFromPath(window.location.pathname).language);

  if (pageLanguage !== DEFAULT_LANGUAGE) {
    return status === 429 ? createTranslator(pageLanguage).t("apiErrors.rateLimited") : "";
  }

  return payload?.message || getTextErrorMessage(textPayload) || `API-anropet misslyckades (${status}).`;
}

async function request(path, { language, ...options } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const isJsonResponse = contentType.includes("application/json");
  const payload = isJsonResponse ? await response.json().catch(() => null) : null;
  const textPayload = isJsonResponse ? "" : await response.text().catch(() => "");

  if (!response.ok) {
    const error = new Error(
      getErrorMessage({ payload, textPayload, status: response.status, language })
    );
    // Maskinläsbar kod och status vid sidan av texten, så anroparen kan agera på
    // feltypen (t.ex. INSPIRATION_IMAGE_FAILED) i stället för att matcha på ett
    // svenskt meddelande som kan ändras eller översättas.
    if (payload?.code) error.code = payload.code;
    error.status = response.status;
    throw error;
  }

  return payload?.data ?? payload;
}

export function getPublicStudios() {
  return request("/api/public/studios").then(normalizeArrayPayload).then(pinStudiosFirst);
}

/**
 * Räknar ett besök på studions publika länk. Fire-and-forget: mätningen får
 * aldrig påverka sidan, så fel sväljs. `keepalive` gör att anropet överlever
 * om besökaren klickar vidare direkt.
 */
export function recordStudioVisit(slug, payload) {
  return fetch(`${API_BASE}/api/public/studios/${encodeURIComponent(slug)}/visit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

export function getPublicStudioBySlug(slug) {
  return request(`/api/public/studios/${encodeURIComponent(slug)}`);
}

export function previewPublicStudioBooking(slug, payload) {
  return request(`/api/public/studios/${encodeURIComponent(slug)}/booking-preview`, {
    method: "POST",
    body: JSON.stringify(payload || {})
  });
}

export function createPublicStudioLead(slug, payload) {
  return request(`/api/public/studios/${encodeURIComponent(slug)}/leads`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getStudioPaymentInfo(slug) {
  return request(`/api/public/studios/${encodeURIComponent(slug)}/payment-info`);
}

export function createStudioPaymentIntent(slug, payload) {
  return request(`/api/public/studios/${encodeURIComponent(slug)}/payment-intent`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function savePublicStudioLeadDraft(slug, payload) {
  return request(`/api/public/studios/${encodeURIComponent(slug)}/lead-drafts`, {
    method: "POST",
    body: JSON.stringify(payload || {})
  });
}

export function createStrategyCall(payload) {
  return request("/api/booking", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function saveStrategyCallDraft(payload) {
  return request("/api/public/sales-lead-drafts", {
    method: "POST",
    body: JSON.stringify(payload || {})
  });
}

// ── Luckåtervinning: kunden klickar på länken i erbjudande-SMS:et ────────────
// Token i länken är hela autentiseringen — därför skickas den aldrig vidare
// någon annanstans, och svaret innehåller bara mottagarens egen information.

export function getSlotOffer(token) {
  return request(`/api/public/slot-offers/${encodeURIComponent(token)}`);
}

export function acceptSlotOffer(token) {
  return request(`/api/public/slot-offers/${encodeURIComponent(token)}/accept`, {
    method: "POST"
  });
}

export function unsubscribeFromSlotOffers(token) {
  return request(`/api/public/slot-offers/${encodeURIComponent(token)}/unsubscribe`, {
    method: "POST"
  });
}

// ── Betallänken: kunden betalar förskottet för en tid studion bokat ─────────
// Token i länken är behörigheten. Beloppet bestäms av servern ur bokningen —
// kroppen bär bara kundens godkännande av reglerna.

export function getPaymentLink(token) {
  return request(`/api/public/payment-links/${encodeURIComponent(token)}`);
}

export function createPaymentLinkIntent(token, { acceptedPolicyVersion, language }) {
  return request(`/api/public/payment-links/${encodeURIComponent(token)}/payment-intent`, {
    method: "POST",
    body: JSON.stringify({ acceptedPolicyVersion, language }),
    language
  });
}
