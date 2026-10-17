import { useEffect, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * Kvittensen efter en skickad förfrågan. Den ersätter formuläret, så att kunden
 * ser direkt att förfrågan gick fram, i stället för en rad ovanför ett tomt
 * formulär. Sammanfattningen visar vad som skickades och var studion når
 * kunden, så att ett felskrivet nummer upptäcks innan studion försöker ringa.
 *
 * chips = korta värden på en rad (typ, stil, placering, storlek),
 * rows = { label, value } (vald tid, tatuerare), notes = lösa rader (bilder),
 * contact = telefon och e-post som kunden skrev dem.
 */
export function LeadSentScreen({
  containerRef,
  title,
  amount = "",
  message,
  chips = [],
  rows = [],
  notes = [],
  contact = [],
  onNewRequest
}) {
  const { t } = useLanguage();
  const titleRef = useRef(null);

  // Fokus på rubriken: skärmläsaren läser upp kvittensen, och tangentbordet
  // fortsätter härifrån i stället för från en knapp som inte finns längre.
  // Scrollningen sköter formuläret (scrollToTop), därav preventScroll.
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  const hasSummary = chips.length > 0 || rows.length > 0 || notes.length > 0;

  return (
    <div className="booking-form lead-sent" ref={containerRef}>
      <svg className="lead-sent__icon" viewBox="0 0 52 52" aria-hidden="true" focusable="false">
        <circle cx="26" cy="26" r="24" />
        <path d="M15 27l7.5 7.5L37.5 19" />
      </svg>
      <h2 className="lead-sent__title" ref={titleRef} tabIndex={-1}>
        {title}
      </h2>
      {amount ? <p className="lead-sent__amount">{amount}</p> : null}
      <p className="lead-sent__message">{message}</p>

      {hasSummary || contact.length > 0 ? (
        <div className="lead-sent__summary">
          {hasSummary ? (
            <section className="lead-sent__section">
              <h3 className="lead-sent__label">{t("leadForm.sentSummaryTitle")}</h3>
              {chips.length > 0 ? (
                <ul className="lead-sent__chips">
                  {chips.map((chip) => (
                    <li key={chip}>{chip}</li>
                  ))}
                </ul>
              ) : null}
              {rows.map((row) => (
                <p key={row.label} className="lead-sent__row">
                  <span>{row.label}</span> {row.value}
                </p>
              ))}
              {notes.map((note) => (
                <p key={note} className="lead-sent__row">
                  {note}
                </p>
              ))}
            </section>
          ) : null}
          {contact.length > 0 ? (
            <section className="lead-sent__section">
              <h3 className="lead-sent__label">{t("leadForm.sentContactTitle")}</h3>
              <p className="lead-sent__contact">
                {contact.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </p>
            </section>
          ) : null}
        </div>
      ) : null}

      <button type="button" className="btn btn-secondary lead-sent__again" onClick={onNewRequest}>
        {t("leadForm.newRequest")}
      </button>
    </div>
  );
}
