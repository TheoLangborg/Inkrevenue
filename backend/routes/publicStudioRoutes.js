import { Router } from "express";
import {
  enforceBookingPreviewRateLimit,
  enforcePublicReadRateLimit,
  enforceSubmissionRateLimit,
  enforceDraftSaveRateLimit,
  enforceVisitTrackingRateLimit
} from "../middleware/rateLimit.js";
import { requestCrmPublicApi, getCrmProxyMessage } from "../utils/crmClient.js";

export const publicStudioRouter = Router();

publicStudioRouter.get("/", async (req, res) => {
  const rateLimit = enforcePublicReadRateLimit(req, "public-studios-list");

  if (rateLimit.limited) {
    return res.status(429).json({ message: rateLimit.message });
  }

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
  } catch {
    return res.status(502).json({
      message: "Kunde inte ansluta till CRM-backenden för att läsa studior."
    });
  }
});

publicStudioRouter.get("/:slug", async (req, res) => {
  const rateLimit = enforcePublicReadRateLimit(req, "public-studio-by-slug");

  if (rateLimit.limited) {
    return res.status(429).json({ message: rateLimit.message });
  }

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
  } catch {
    return res.status(502).json({
      message: "Kunde inte ansluta till CRM-backenden för att läsa studiosidan."
    });
  }
});

// Beacon från studiosidan: räknar klick på studions publika länk. Måste finnas
// HÄR också — frontenden når aldrig CRM-backenden direkt, utan varje publik väg
// måste öppnas explicit i den här proxyn. Saknas den svarar proxyn 404 och
// mätningen dör tyst, eftersom beaconen sväljer alla fel med flit.
//
// Svarar alltid 204: statistik får aldrig påverka besökarens sida.
publicStudioRouter.post("/:slug/visit", async (req, res) => {
  const rateLimit = enforceVisitTrackingRateLimit(req, "studio-public-visit");

  if (rateLimit.limited) {
    return res.status(204).end();
  }

  try {
    await requestCrmPublicApi(`/studios/${encodeURIComponent(req.params.slug)}/visit`, {
      method: "POST",
      body: req.body || {},
      request: req
    });
  } catch {
    // Tyst: ett tappat besök är bättre än ett fel hos besökaren.
  }

  return res.status(204).end();
});

// Beacon från provningen på kroppen i förfrågan (öppnad, foto, motiv, lagd i
// förfrågan, förfrågan skickad). Samma regler som besöken ovan: vägen måste
// finnas här, och svaret är alltid 204.
publicStudioRouter.post("/:slug/try-on-event", async (req, res) => {
  const rateLimit = enforceVisitTrackingRateLimit(req, "studio-public-try-on");

  if (rateLimit.limited) {
    return res.status(204).end();
  }

  try {
    await requestCrmPublicApi(`/studios/${encodeURIComponent(req.params.slug)}/try-on-event`, {
      method: "POST",
      body: { event: req.body?.event },
      request: req
    });
  } catch {
    // Tyst: ett tappat steg är bättre än ett fel hos besökaren.
  }

  return res.status(204).end();
});

publicStudioRouter.post("/:slug/booking-preview", async (req, res) => {
  const rateLimit = enforceBookingPreviewRateLimit(req, "studio-public-booking-preview");

  if (rateLimit.limited) {
    return res.status(429).json({ message: rateLimit.message });
  }

  try {
    const { response, payload } = await requestCrmPublicApi(
      `/studios/${encodeURIComponent(req.params.slug)}/booking-preview`,
      { method: "POST", body: req.body || {}, request: req }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: getCrmProxyMessage(payload, "Kunde inte avgöra direktbokning just nu.")
      });
    }

    return res.status(response.status).json(payload || { data: null });
  } catch {
    return res.status(502).json({
      message: "Kunde inte ansluta till CRM-backenden för att kontrollera direktbokning."
    });
  }
});

publicStudioRouter.post("/:slug/leads", async (req, res) => {
  const rateLimit = enforceSubmissionRateLimit(req, "studio-public-lead");

  if (rateLimit.limited) {
    return res.status(429).json({ message: rateLimit.message });
  }

  try {
    const { response, payload } = await requestCrmPublicApi(
      `/studios/${encodeURIComponent(req.params.slug)}/leads`,
      { method: "POST", body: req.body || {}, request: req }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: getCrmProxyMessage(payload, "Kunde inte skicka förfrågan just nu."),
        // Felkoden måste följa med hela vägen ut till formuläret. CRM:et märker
        // t.ex. INSPIRATION_IMAGE_FAILED, och utan koden hade formuläret fått
        // matcha på den svenska feltexten för att veta att det var bilagan som
        // fällde inskickningen — och kunden hade blivit utan "skicka utan bild".
        ...(payload?.code ? { code: payload.code } : {})
      });
    }

    return res.status(response.status).json(payload || { data: null });
  } catch {
    return res.status(502).json({
      message: "Kunde inte ansluta till CRM-backenden för att skicka förfrågan."
    });
  }
});

publicStudioRouter.get("/:slug/payment-info", async (req, res) => {
  const rateLimit = enforcePublicReadRateLimit(req, "studio-public-payment-info");

  if (rateLimit.limited) {
    return res.status(429).json({ message: rateLimit.message });
  }

  try {
    const { response, payload } = await requestCrmPublicApi(
      `/studios/${encodeURIComponent(req.params.slug)}/payment-info`,
      { request: req }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: getCrmProxyMessage(payload, "Kunde inte hämta betalningsinformation just nu.")
      });
    }

    return res.status(response.status).json(payload || { data: null });
  } catch {
    return res.status(502).json({
      message: "Kunde inte ansluta till CRM-backenden för att hämta betalningsinformation."
    });
  }
});

publicStudioRouter.post("/:slug/payment-intent", async (req, res) => {
  const rateLimit = enforceSubmissionRateLimit(req, "studio-public-payment-intent");

  if (rateLimit.limited) {
    return res.status(429).json({ message: rateLimit.message });
  }

  try {
    const { response, payload } = await requestCrmPublicApi(
      `/studios/${encodeURIComponent(req.params.slug)}/payment-intent`,
      { method: "POST", body: req.body || {}, request: req }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: getCrmProxyMessage(payload, "Kunde inte starta betalningen just nu.")
      });
    }

    return res.status(response.status).json(payload || { data: null });
  } catch {
    return res.status(502).json({
      message: "Kunde inte ansluta till CRM-backenden för att starta betalningen."
    });
  }
});

publicStudioRouter.post("/:slug/lead-drafts", async (req, res) => {
  const rateLimit = enforceDraftSaveRateLimit(req, "studio-public-lead-draft");

  if (rateLimit.limited) {
    return res.status(429).json({ message: rateLimit.message });
  }

  try {
    const { response, payload } = await requestCrmPublicApi(
      `/studios/${encodeURIComponent(req.params.slug)}/lead-drafts`,
      { method: "POST", body: req.body || {}, request: req }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: getCrmProxyMessage(payload, "Kunde inte spara det påbörjade formuläret just nu.")
      });
    }

    return res.status(response.status).json(payload || { data: null });
  } catch {
    return res.status(502).json({
      message: "Kunde inte ansluta till CRM-backenden för att spara utkastet."
    });
  }
});
