import express from "express";
import cors from "cors";

function normalizeOrigin(origin) {
  return origin?.trim().replace(/\/+$/, "");
}

const app = express();
const PORT = Number(process.env.PORT || 5000);
const CRM_API_BASE_URL = normalizeUrl(process.env.CRM_API_BASE_URL || "http://localhost:4000");
const submissionRateLimitState = new Map();
const submissionWindowMs = Number(process.env.SUBMISSION_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const submissionMaxRequests = Number(process.env.SUBMISSION_RATE_LIMIT_MAX || 6);

function normalizeUrl(url) {
  return url?.trim().replace(/\/+$/, "");
}

function getAllowedOrigins() {
  const configuredOrigins =
    process.env.FRONTEND_URL?.split(",")
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean) || [];

  return configuredOrigins.length
    ? configuredOrigins
    : [normalizeOrigin("http://localhost:5174"), normalizeOrigin("http://localhost:5173")];
}

function buildCrmLeadPayload(payload) {
  const name = String(payload.name || "").trim();
  const studio = String(payload.studio || "").trim();
  const email = String(payload.email || "")
    .trim()
    .toLowerCase();
  const phone = String(payload.phone || "").trim();
  const message = String(payload.message || "").trim();

  return {
    name,
    email,
    phone,
    tattooStyle: "strategisamtal",
    placement: studio,
    description: [
      `Studio: ${studio}`,
      message ? `Meddelande: ${message}` : "Meddelande: Inget extra meddelande lämnades."
    ].join("\n"),
    privacyConsent: payload.privacyConsent === true,
    marketingConsent: payload.marketingConsent === true,
    source: "inkrevenue_strategy_call",
    landingPageType: "studio_page",
    pageUrl: String(payload.pageUrl || "").trim(),
    referrerUrl: String(payload.referrerUrl || "").trim(),
    utmSource: String(payload.utmSource || "").trim(),
    utmMedium: String(payload.utmMedium || "").trim(),
    utmCampaign: String(payload.utmCampaign || "").trim(),
    utmContent: String(payload.utmContent || "").trim(),
    utmTerm: String(payload.utmTerm || "").trim(),
    gclid: String(payload.gclid || "").trim(),
    fbclid: String(payload.fbclid || "").trim(),
    website: String(payload.website || "").trim()
  };
}

function buildCrmSalesLeadPayload(payload) {
  return {
    name: String(payload.name || "").trim(),
    studioName: String(payload.studio || "").trim(),
    email: String(payload.email || "")
      .trim()
      .toLowerCase(),
    phone: String(payload.phone || "").trim(),
    description: String(payload.message || "").trim(),
    privacyConsent: payload.privacyConsent === true,
    marketingConsent: payload.marketingConsent === true,
    source: "inkrevenue_strategy_call",
    pageUrl: String(payload.pageUrl || "").trim(),
    referrerUrl: String(payload.referrerUrl || "").trim(),
    utmSource: String(payload.utmSource || "").trim(),
    utmMedium: String(payload.utmMedium || "").trim(),
    utmCampaign: String(payload.utmCampaign || "").trim(),
    utmContent: String(payload.utmContent || "").trim(),
    utmTerm: String(payload.utmTerm || "").trim(),
    gclid: String(payload.gclid || "").trim(),
    fbclid: String(payload.fbclid || "").trim(),
    website: String(payload.website || "").trim()
  };
}

function createCrmPublicUrl(pathname, query = {}) {
  const url = new URL(`${CRM_API_BASE_URL}/api/public${pathname}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    const normalizedValue = String(value ?? "").trim();

    if (normalizedValue) {
      url.searchParams.set(key, normalizedValue);
    }
  });

  return url;
}

async function requestCrmPublicApi(pathname, { method = "GET", body = null, query = {}, request } = {}) {
  const response = await fetch(createCrmPublicUrl(pathname, query), {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Origin: request?.get("origin") || "",
      Referer: body?.pageUrl || request?.get("referer") || ""
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => null);

  return { response, payload };
}

function getCrmProxyMessage(payload, fallbackMessage) {
  return payload?.message || fallbackMessage;
}

function getClientAddress(request) {
  const forwardedFor = request.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor
      .split(",")
      .map((value) => value.trim())
      .find(Boolean);
  }

  return request.ip || request.socket?.remoteAddress || "unknown";
}

function enforceSubmissionRateLimit(request, scope) {
  const key = `${scope}:${getClientAddress(request)}`;
  const now = Date.now();
  const activeAttempts = (submissionRateLimitState.get(key) || []).filter(
    (timestamp) => now - timestamp < submissionWindowMs
  );

  if (activeAttempts.length >= submissionMaxRequests) {
    return {
      limited: true,
      message:
        "Vi har tagit emot många försök från samma anslutning på kort tid. Vänta en stund och försök igen."
    };
  }

  activeAttempts.push(now);
  submissionRateLimitState.set(key, activeAttempts);

  return { limited: false };
}

app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = normalizeOrigin(origin);
      const allowedOrigins = getAllowedOrigins();

      if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin saknar CORS-behörighet."));
    },
    methods: ["GET", "POST"]
  })
);
app.use(express.json({ limit: "6mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    crmApiBaseUrl: CRM_API_BASE_URL
  });
});

app.get("/api/public/studios", async (req, res) => {
  try {
    const { response, payload } = await requestCrmPublicApi("/studios", {
      query: req.query,
      request: req
    });

    if (!response.ok) {
      return res.status(response.status).json({
        message: getCrmProxyMessage(payload, "Kunde inte hämta studiolistan just nu.")
      });
    }

    return res.status(response.status).json(payload || { data: [] });
  } catch (error) {
    console.error("Kunde inte hämta publika studior från CRM:", error);

    return res.status(502).json({
      message: "Kunde inte ansluta till CRM-backenden för att läsa studior."
    });
  }
});

app.get("/api/public/studios/:slug", async (req, res) => {
  try {
    const { response, payload } = await requestCrmPublicApi(
      `/studios/${encodeURIComponent(req.params.slug)}`,
      { request: req }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: getCrmProxyMessage(payload, "Studion kunde inte hämtas.")
      });
    }

    return res.status(response.status).json(payload || { data: null });
  } catch (error) {
    console.error("Kunde inte hämta publik studiosida från CRM:", error);

    return res.status(502).json({
      message: "Kunde inte ansluta till CRM-backenden för att läsa studiosidan."
    });
  }
});

app.post("/api/public/studios/:slug/leads", async (req, res) => {
  const rateLimit = enforceSubmissionRateLimit(req, "studio-public-lead");

  if (rateLimit.limited) {
    return res.status(429).json({
      message: rateLimit.message
    });
  }

  try {
    const { response, payload } = await requestCrmPublicApi(
      `/studios/${encodeURIComponent(req.params.slug)}/leads`,
      {
        method: "POST",
        body: req.body || {},
        request: req
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: getCrmProxyMessage(payload, "Kunde inte skicka förfrågan just nu.")
      });
    }

    return res.status(response.status).json(payload || { data: null });
  } catch (error) {
    console.error("Kunde inte skicka publik studioförfrågan till CRM:", error);

    return res.status(502).json({
      message: "Kunde inte ansluta till CRM-backenden för att skicka förfrågan."
    });
  }
});

app.post("/api/booking", async (req, res) => {
  const { name, studio, email, privacyConsent } = req.body || {};

  if (!String(name || "").trim() || !String(studio || "").trim() || !String(email || "").trim()) {
    return res.status(400).json({
      message: "Namn, studio och e-post krävs."
    });
  }

  if (privacyConsent !== true) {
    return res.status(400).json({
      message: "Du behöver godkänna att vi sparar dina uppgifter innan formuläret kan skickas."
    });
  }

  const rateLimit = enforceSubmissionRateLimit(req, "strategy-call");

  if (rateLimit.limited) {
    return res.status(429).json({
      message: rateLimit.message
    });
  }

  try {
    const { response, payload } = await requestCrmPublicApi(
      "/sales-leads",
      {
        method: "POST",
        body: buildCrmSalesLeadPayload(req.body || {}),
        request: req
      }
    );

    if (!response.ok) {
      const message = getCrmProxyMessage(payload, "CRM kunde inte ta emot formuläret just nu.");

      return res.status(response.status).json({ message });
    }

    return res.status(201).json({
      data: {
        ...(payload?.data || {}),
        successMessage:
          payload?.data?.successMessage ||
          "Tack! Vi har tagit emot din förfrågan och återkommer normalt inom 24 timmar på vardagar."
      }
    });
  } catch (error) {
    console.error("Kunde inte skicka formuläret till CRM:", error);

    return res.status(502).json({
      message:
        "Kunde inte ansluta till CRM-backenden. Kontrollera att CRM-backenden körs och att CRM_API_BASE_URL stämmer."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Ink Revenue API running on http://localhost:${PORT}`);
});
