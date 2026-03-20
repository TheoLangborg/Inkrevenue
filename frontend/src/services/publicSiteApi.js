async function request(path, options = {}) {
  const response = await fetch(path, {
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
  return request("/api/public/studios");
}

export function getPublicStudioBySlug(slug) {
  return request(`/api/public/studios/${encodeURIComponent(slug)}`);
}

export function createPublicStudioLead(slug, payload) {
  return request(`/api/public/studios/${encodeURIComponent(slug)}/leads`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function createStrategyCall(payload) {
  return request("/api/booking", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
