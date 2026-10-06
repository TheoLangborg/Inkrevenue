import { useCallback, useEffect, useState } from "react";
import { buildPageTitle, usePageMetadata } from "../utils/pageMetadata";
import { buildSlotOfferTermsView } from "../utils/slotOfferTerms";
import { useLanguage } from "../i18n/LanguageContext";
import { DEFAULT_LANGUAGE } from "../i18n/config";
import {
  getSlotOffer,
  acceptSlotOffer,
  unsubscribeFromSlotOffers
} from "../services/publicSiteApi";

/**
 * Sidan kunden landar på från erbjudande-SMS:et ("En tid har blivit ledig…").
 *
 * Designad för en person som står med mobilen och har ont om tid: tiden stort,
 * en enda knapp, och ett tydligt besked om någon annan hann före. Ingen header
 * — sidans enda syfte är ja eller nej.
 */

// Servern skickar tiden som färdig svensk text, samma som i SMS:et. Den visas
// på svenska; på engelska formateras starttiden, annars blev veckodagen svensk.
function formatReadableTime(value, readableTime, language, locale) {
  if (language === DEFAULT_LANGUAGE && readableTime) return readableTime;
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return readableTime || "";
  return date.toLocaleString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm"
  });
}

function formatDuration(minutes, t, locale) {
  if (!minutes) return "";
  if (minutes < 60) return t("slotOffer.durationMinutes", { count: minutes });
  const hours = Math.round((minutes / 60) * 10) / 10;
  if (hours === 1) return t("slotOffer.durationHour");
  return t("slotOffer.durationHours", { count: new Intl.NumberFormat(locale).format(hours) });
}

/**
 * Villkoren, i klartext, ovanför knappen (punkt 14).
 *
 * Texterna byggs i `slotOfferTerms.js` — den är ren och testad, det här är bara
 * uppställningen.
 */
function OfferTerms({ terms, showConsent = true }) {
  const { t, language } = useLanguage();
  const rows = buildSlotOfferTermsView(terms, language);

  if (!rows.length) return null;

  return (
    <div className="slot-offer__terms">
      <dl className="slot-offer__term-list">
        {rows.map((row) => (
          <div className="slot-offer__term" key={row.key}>
            <dt>{row.label}</dt>
            <dd>{row.text}</dd>
          </div>
        ))}
      </dl>

      {showConsent ? (
        <p className="slot-offer__terms-note">{t("slotOffer.consentNote")}</p>
      ) : null}
    </div>
  );
}

// Varför erbjudandet inte går att ta, i klartext: nycklarna under
// slotOffer.reasons. too_soon = studion kräver ett minsta varsel; tiden finns
// kvar, men inte via länken.
const UNAVAILABLE_REASONS = [
  "already_filled",
  "slot_closed",
  "offer_expired",
  "offer_revoked",
  "slot_in_past",
  "too_soon"
];

export function SlotOfferPage({ token }) {
  const { t, language, locale } = useLanguage();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [unsubscribed, setUnsubscribed] = useState(false);

  usePageMetadata({
    title: buildPageTitle(t("slotOffer.metaTitle")),
    description: t("slotOffer.metaDescription")
  });

  const load = useCallback(async () => {
    try {
      const data = await getSlotOffer(token);
      setOffer(data);
    } catch (loadError) {
      setError(loadError.message || t("slotOffer.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAccept() {
    setAccepting(true);
    setError("");
    try {
      const data = await acceptSlotOffer(token);
      setResult(data);
    } catch (acceptError) {
      setError(acceptError.message || t("slotOffer.acceptFailed"));
      // Läs om läget så knappen inte ligger kvar och lockar till fler försök.
      await load();
    } finally {
      setAccepting(false);
    }
  }

  async function handleUnsubscribe() {
    setError("");
    try {
      await unsubscribeFromSlotOffers(token);
      setUnsubscribed(true);
    } catch (unsubscribeError) {
      setError(unsubscribeError.message || t("slotOffer.unsubscribeFailed"));
    }
  }

  if (loading) {
    return (
      <main className="slot-offer">
        <p className="slot-offer__loading">{t("slotOffer.loading")}</p>
      </main>
    );
  }

  if (unsubscribed) {
    return (
      <main className="slot-offer">
        <div className="slot-offer__card">
          <h1 className="slot-offer__title">{t("slotOffer.unsubscribedTitle")}</h1>
          <p className="slot-offer__note">{t("slotOffer.unsubscribedText")}</p>
        </div>
      </main>
    );
  }

  if (result?.booked) {
    return (
      <main className="slot-offer">
        <div className="slot-offer__card slot-offer__card--done">
          <div className="slot-offer__check" aria-hidden="true">✓</div>
          <h1 className="slot-offer__title">{t("slotOffer.bookedTitle")}</h1>
          <p className="slot-offer__time">
            {formatReadableTime(result.startTime, result.readableTime, language, locale)}
          </p>
          <p className="slot-offer__note">{t("slotOffer.bookedText")}</p>
          {/* Upprepas på kvittot: villkoren är först nu bindande, och det här är
              enda skärmen kunden har kvar när SMS-länken är förbrukad. */}
          <OfferTerms terms={result.terms} showConsent={false} />
        </div>
      </main>
    );
  }

  if (!offer) {
    return (
      <main className="slot-offer">
        <div className="slot-offer__card">
          <h1 className="slot-offer__title">{t("slotOffer.goneTitle")}</h1>
          <p className="slot-offer__note">{error || t("slotOffer.goneText")}</p>
        </div>
      </main>
    );
  }

  const unavailableReason =
    !offer.acceptable && UNAVAILABLE_REASONS.includes(offer.reason)
      ? t(`slotOffer.reasons.${offer.reason}`)
      : null;
  const firstName = String(offer.customerName || "").trim().split(/\s+/)[0];

  return (
    <main className="slot-offer">
      <div className="slot-offer__card">
        <p className="slot-offer__eyebrow">{t("slotOffer.eyebrow")}</p>
        <h1 className="slot-offer__title">
          {firstName ? t("slotOffer.greeting", { name: firstName }) : t("slotOffer.greetingFallback")}
        </h1>

        <p className="slot-offer__time">
          {formatReadableTime(offer.startTime, offer.readableTime, language, locale)}
        </p>

        <p className="slot-offer__meta">
          {formatDuration(offer.durationMinutes, t, locale)}
          {offer.artistName ? ` ${t("slotOffer.withArtist", { artist: offer.artistName })}` : ""}
        </p>

        {offer.acceptable ? (
          <>
            <OfferTerms terms={offer.terms} />
            <button
              type="button"
              className="slot-offer__button"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? t("slotOffer.accepting") : t("slotOffer.accept")}
            </button>
            <p className="slot-offer__note">{t("slotOffer.firstComeNote")}</p>
          </>
        ) : (
          <p className="slot-offer__note slot-offer__note--warning">
            {unavailableReason || t("slotOffer.notBookable")}
          </p>
        )}

        {error && <p className="slot-offer__note slot-offer__note--warning">{error}</p>}

        {/* Opt-out. Måste finnas här: ett alfanumeriskt SMS-avsändarnamn kan inte
            ta emot STOPP-svar, så det här är kundens enda självbetjäningsväg ut. */}
        <button type="button" className="slot-offer__unsubscribe" onClick={handleUnsubscribe}>
          {t("slotOffer.unsubscribe")}
        </button>
      </div>
    </main>
  );
}
