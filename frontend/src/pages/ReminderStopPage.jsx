import { useState } from "react";
import { buildPageTitle, usePageMetadata } from "../utils/pageMetadata";
import { useLanguage } from "../i18n/LanguageContext";
import { stopFormDraftReminders } from "../services/publicSiteApi";

/**
 * Sidan länken i en påminnelse om ett avbrutet formulär leder till
 * (/paminnelser/stopp/:draftId). Varje påminnelse ska gå att tacka nej till,
 * och SMS-avsändarnamnet kan inte ta emot ett STOPP-svar.
 *
 * Avregistreringen kräver ett klick. Den görs inte när sidan laddas, eftersom
 * mejlprogrammens länkskannrar öppnar länkar i förväg.
 */
export function ReminderStopPage({ draftId }) {
  const { t } = useLanguage();
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  usePageMetadata({
    title: buildPageTitle(t("reminderStop.metaTitle")),
    description: t("reminderStop.metaDescription"),
    noIndex: true
  });

  async function handleStop() {
    setState("loading");
    setError("");
    try {
      await stopFormDraftReminders(draftId);
      setState("done");
    } catch (stopError) {
      setError(stopError.message || t("reminderStop.failed"));
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <main className="slot-offer">
        <div className="slot-offer__card">
          <h1 className="slot-offer__title">{t("reminderStop.doneTitle")}</h1>
          <p className="slot-offer__note">{t("reminderStop.doneText")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="slot-offer">
      <div className="slot-offer__card">
        <h1 className="slot-offer__title">{t("reminderStop.title")}</h1>
        <p className="slot-offer__note">{t("reminderStop.text")}</p>
        <button
          type="button"
          className="slot-offer__button"
          onClick={handleStop}
          disabled={state === "loading"}
        >
          {state === "loading" ? t("reminderStop.stopping") : t("reminderStop.stop")}
        </button>
        {error ? <p className="slot-offer__note slot-offer__note--warning">{error}</p> : null}
      </div>
    </main>
  );
}
