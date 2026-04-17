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

async function request(path, options = {}) {
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
    throw new Error(
      payload?.message ||
        getTextErrorMessage(textPayload) ||
        `API-anropet misslyckades (${response.status}).`
    );
  }

  return payload?.data ?? payload;
}

export function getPublicStudios() {
  return request("/api/public/studios").then(normalizeArrayPayload);
}

export function getPublicStudioBySlug(slug) {
  return request(`/api/public/studios/${encodeURIComponent(slug)}`);
}

export function getPublicStudioAvailability(slug, options = {}) {
  const params = new URLSearchParams();

  Object.entries(options).forEach(([key, value]) => {
    const normalizedValue = String(value ?? "").trim();

    if (normalizedValue) {
      params.set(key, normalizedValue);
    }
  });

  const suffix = params.size ? `?${params.toString()}` : "";
  return request(`/api/public/studios/${encodeURIComponent(slug)}/availability${suffix}`);
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
