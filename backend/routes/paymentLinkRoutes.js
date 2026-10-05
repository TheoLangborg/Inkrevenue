import { Router } from "express";
import {
  enforcePublicReadRateLimit,
  enforceSubmissionRateLimit
} from "../middleware/rateLimit.js";
import { requestCrmPublicApi, getCrmProxyMessage } from "../utils/crmClient.js";

/**
 * Betallänk för en bokad tid (/betala/:token på sajten).
 *
 * Proxar vidare till CRM-backendens publika endpoints. Token i länken är hela
 * autentiseringen, så den skickas vidare orörd och loggas aldrig. Beloppet
 * bestäms av CRM:et ur bokningen — kroppen bär bara kundens godkännande av
 * reglerna.
 */
export const paymentLinkRouter = Router();

paymentLinkRouter.get("/:token", async (req, res) => {
  const rateLimit = enforcePublicReadRateLimit(req, "payment-link-read");

  if (rateLimit.limited) {
    return res.status(429).json({ message: rateLimit.message });
  }

  try {
    const { response, payload } = await requestCrmPublicApi(
      `/payment-links/${encodeURIComponent(req.params.token)}`,
      { request: req }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: getCrmProxyMessage(payload, "Länken finns inte.")
      });
    }

    return res.status(response.status).json(payload);
  } catch {
    return res.status(502).json({
      message: "Kunde inte hämta betalningen just nu. Försök igen om en stund."
    });
  }
});

paymentLinkRouter.post("/:token/payment-intent", async (req, res) => {
  const rateLimit = enforceSubmissionRateLimit(req, "payment-link-intent");

  if (rateLimit.limited) {
    return res.status(429).json({ message: rateLimit.message });
  }

  try {
    const { response, payload } = await requestCrmPublicApi(
      `/payment-links/${encodeURIComponent(req.params.token)}/payment-intent`,
      {
        method: "POST",
        body: {
          acceptedPolicyVersion: String(req.body?.acceptedPolicyVersion || ""),
          language: req.body?.language === "en" ? "en" : "sv"
        },
        request: req
      }
    );

    // Statuskoden bärs vidare oförändrad: 409 betyder att länken inte går att
    // betala längre (betald, utgången, avbokad) och sidan visar då beskedet.
    if (!response.ok) {
      return res.status(response.status).json({
        message: getCrmProxyMessage(payload, "Betalningen gick inte att starta."),
        data: payload?.data || null
      });
    }

    return res.status(response.status).json(payload);
  } catch {
    return res.status(502).json({
      message: "Kunde inte starta betalningen just nu. Inga pengar har dragits. Försök igen om en stund."
    });
  }
});
