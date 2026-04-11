const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function normalizeArrayPayload(payload) {
  return Array.isArray(payload) ? payload.filter(Boolean) : [];
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
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    throw new Error(payload?.message || "Något gick fel vid API-anropet.");
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
