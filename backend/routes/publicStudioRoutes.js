import { Router } from "express";
import {
  enforcePublicReadRateLimit,
  enforceSubmissionRateLimit,
  enforceDraftSaveRateLimit
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

publicStudioRouter.get("/:slug/availability", async (req, res) => {
  const rateLimit = enforcePublicReadRateLimit(req, "studio-public-availability");

  if (rateLimit.limited) {
    return res.status(429).json({ message: rateLimit.message });
  }

  try {
    const { response, payload } = await requestCrmPublicApi(
      `/studios/${encodeURIComponent(req.params.slug)}/availability`,
      { query: req.query, request: req }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: getCrmProxyMessage(payload, "Kunde inte hämta lediga tider just nu.")
      });
    }

    return res.status(response.status).json(payload || { data: null });
  } catch {
    return res.status(502).json({
      message: "Kunde inte ansluta till CRM-backenden för att läsa lediga tider."
    });
  }
});

publicStudioRouter.post("/:slug/booking-preview", async (req, res) => {
  const rateLimit = enforcePublicReadRateLimit(req, "studio-public-booking-preview");

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
        message: getCrmProxyMessage(payload, "Kunde inte skicka förfrågan just nu.")
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
