import { Router } from "express";
import { enforceSubmissionRateLimit } from "../middleware/rateLimit.js";
import { requestCrmPublicApi, getCrmProxyMessage } from "../utils/crmClient.js";

/**
 * Länken i påminnelsen om ett avbrutet formulär (/paminnelser/stopp/:draftId
 * på sajten). Stänger av resten av påminnelserna. Det är kundens enda sätt att
 * tacka nej, eftersom SMS-avsändarnamnet inte kan ta emot svar.
 */
export const formDraftRouter = Router();

formDraftRouter.post("/:draftId/stop-reminders", async (req, res) => {
  const rateLimit = enforceSubmissionRateLimit(req, "form-draft-stop-reminders");

  if (rateLimit.limited) {
    return res.status(429).json({ message: rateLimit.message });
  }

  try {
    const { response, payload } = await requestCrmPublicApi(
      `/form-drafts/${encodeURIComponent(req.params.draftId)}/stop-reminders`,
      { method: "POST", request: req }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: getCrmProxyMessage(payload, "Kunde inte stänga av påminnelserna.")
      });
    }

    return res.status(response.status).json(payload);
  } catch {
    return res.status(502).json({
      message: "Kunde inte stänga av påminnelserna just nu. Försök igen om en stund."
    });
  }
});
