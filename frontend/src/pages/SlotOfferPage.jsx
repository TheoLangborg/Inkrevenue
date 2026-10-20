import { useCallback, useEffect, useState } from "react";
import { buildPageTitle, usePageMetadata } from "../utils/pageMetadata";
import { buildSlotOfferTermsView } from "../utils/slotOfferTerms";
import { useLanguage } from "../i18n/LanguageContext";
import {
  getSlotOffer,
  acceptSlotOffer,
  unsubscribeFromSlotOffers
} from "../services/publicSiteApi";

/**
 * Sidan kunden landar på från erbjudande-SMS:et ("En tid har blivit ledig…").
 *
 * Designad för en person som står med mobilen och har ont om tid: tiden i en
 * tydlig lista, en enda knapp, och ett tydligt besked om någon annan hann före.
 * Ingen header — sidans enda syfte är ja eller nej.
 *
 * Utseendet är CRM:ets (Inter, ljusgrå yta, vita kort, blå primärknapp,
 * statusbrickor), inte marknadssajtens: det är studions bokningssystem som
 * skickar erbjudandet, och sidan ska se ut som en del av det.
 */

const TIME_ZONE = "Europe/Stockholm";

function toDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function formatDate(start, locale) {
  return capitalize(
    start.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: TIME_ZONE
    })
  );
}

function formatClock(date, locale) {
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });
}

function formatDuration(minutes, t, locale) {
  if (!minutes) return "";
  if (minutes < 60) return t("slotOffer.durationMinutes", { count: minutes });
  const hours = Math.round((minutes / 60) * 10) / 10;
  if (hours === 1) return t("slotOffer.durationHour");
  return t("slotOffer.durationHours", { count: new Intl.NumberFormat(locale).format(hours) });
}

// Datum, tid, längd och tatuerare som en CRM-detaljlista. Saknas tiderna (äldre
// svar) står serverns färdiga text kvar som enda rad.
function SlotDetails({ offer }) {
  const { t, locale } = useLanguage();
  const start = toDate(offer?.startTime);
  const durationMinutes = Number(offer?.durationMinutes) || 0;
  const end =
    toDate(offer?.endTime) ||
    (start && durationMinutes ? new Date(start.getTime() + durationMinutes * 60000) : null);

  const rows = start
    ? [
        { key: "date", label: t("slotOffer.detailDate"), value: formatDate(start, locale) },
        {
          key: "time",
          label: t("slotOffer.detailTime"),
          value: end
            ? `${formatClock(start, locale)}–${formatClock(end, locale)}`
            : formatClock(start, locale)
        },
        {
          key: "duration",
          label: t("slotOffer.detailDuration"),
          value: formatDuration(durationMinutes, t, locale)
        },
        { key: "artist", label: t("slotOffer.detailArtist"), value: offer?.artistName || "" }
      ]
    : [{ key: "time", label: t("slotOffer.detailTime"), value: offer?.readableTime || "" }];

  return (
    <dl className="crm-offer__details">
      {rows
        .filter((row) => row.value)
        .map((row) => (
          <div className="crm-offer__detail" key={row.key}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
    </dl>
  );
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
    <div className="crm-offer__terms">
      <p className="crm-offer__section-label">{t("slotOffer.termsTitle")}</p>
      <dl className="crm-offer__term-list">
        {rows.map((row) => (
          <div className="crm-offer__term" key={row.key}>
            <dt>{row.label}</dt>
            <dd>{row.text}</dd>
          </div>
        ))}
      </dl>

      {showConsent ? <p className="crm-offer__terms-note">{t("slotOffer.consentNote")}</p> : null}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m9 15 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Samma pinne som i CRM:ets logga.
function BrandMark() {
  return (
    <svg width="22" height="30" viewBox="0 0 24 32" fill="none" aria-hidden="true">
      <path
        d="M12 2C7 2 3.5 5.5 3.5 10C3.5 17 12 30 12 30C12 30 20.5 17 20.5 10C20.5 5.5 17 2 12 2Z"
        fill="rgba(31,74,204,0.06)"
        stroke="#172033"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="4" fill="#d97706" />
      <circle cx="10.5" cy="8.5" r="1.2" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

function OfferShell({ studioName, children }) {
  return (
    <div className="crm-offer">
      <div className="crm-offer__brand">
        <BrandMark />
        <div className="crm-offer__brand-text">
          <strong>InkRevenue</strong>
          {studioName ? <span>{studioName}</span> : null}
        </div>
      </div>
      <section className="crm-offer__card">{children}</section>
    </div>
  );
}

function OfferHeader({ icon, tone = "primary", title, text, badge }) {
  return (
    <header className="crm-offer__header">
      <div className={`crm-offer__icon crm-offer__icon--${tone}`}>{icon}</div>
      <div className="crm-offer__header-text">
        {badge}
        <h1 className="crm-offer__title">{title}</h1>
        {text ? <p className="crm-offer__lead">{text}</p> : null}
      </div>
    </header>
  );
}

function Badge({ tone, children }) {
  return <span className={`crm-offer__badge crm-offer__badge--${tone}`}>{children}</span>;
}

// Varför erbjudandet inte går att ta: rubrik, bricka och text under
// slotOffer.unavailable.<reason>. too_soon = studion kräver ett minsta varsel;
// tiden finns kvar, men inte via länken. Okända orsaker får "generic".
const UNAVAILABLE_REASONS = [
  "already_filled",
  "slot_closed",
  "offer_expired",
  "offer_revoked",
  "slot_in_past",
  "too_soon"
];

// "Onsdag 21 oktober · 13:00–15:00", överstruken på sidan för en upptagen tid.
function formatSlotLine(offer, locale) {
  const start = toDate(offer?.startTime);
  if (!start) return offer?.readableTime || "";
  const end = toDate(offer?.endTime);
  const time = end
    ? `${formatClock(start, locale)}–${formatClock(end, locale)}`
    : formatClock(start, locale);
  return `${formatDate(start, locale)} · ${time}`;
}

function CalendarOffIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m10 13.5 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Opt-out. Måste finnas på sidan: ett alfanumeriskt SMS-avsändarnamn kan inte
// ta emot STOPP-svar, så det här är kundens enda självbetjäningsväg ut.
function UnsubscribeFooter({ onUnsubscribe }) {
  const { t } = useLanguage();
  return (
    <div className="crm-offer__footer">
      <button type="button" className="crm-offer__unsubscribe" onClick={onUnsubscribe}>
        {t("slotOffer.unsubscribe")}
      </button>
    </div>
  );
}

export function SlotOfferPage({ token }) {
  const { t, locale } = useLanguage();
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
      return data;
    } catch (loadError) {
      setError(loadError.message || t("slotOffer.loadFailed"));
      return null;
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
      // Läs om läget så knappen inte ligger kvar och lockar till fler försök.
      // Går tiden inte längre att ta säger sidan redan varför — samma besked
      // ska inte stå två gånger.
      const fresh = await load();
      setError(fresh && !fresh.acceptable ? "" : acceptError.message || t("slotOffer.acceptFailed"));
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

  const studioName = offer?.studioName || "";

  if (loading) {
    return (
      <OfferShell>
        <div className="crm-offer__loading" role="status">
          <span className="crm-offer__spinner" aria-hidden="true" />
          <p>{t("slotOffer.loading")}</p>
        </div>
      </OfferShell>
    );
  }

  if (unsubscribed) {
    return (
      <OfferShell studioName={studioName}>
        <OfferHeader
          icon={<InfoIcon />}
          tone="neutral"
          title={t("slotOffer.unsubscribedTitle")}
          text={t("slotOffer.unsubscribedText")}
        />
      </OfferShell>
    );
  }

  // Bokad: direkt efter ja-svaret, eller när samma person öppnar länken igen.
  if (result?.booked || offer?.reason === "accepted_by_you") {
    return (
      <OfferShell studioName={studioName}>
        <OfferHeader
          icon={<CheckIcon />}
          tone="success"
          badge={<Badge tone="success">{t("slotOffer.badgeBooked")}</Badge>}
          title={t("slotOffer.bookedTitle")}
          text={t("slotOffer.bookedText")}
        />
        <SlotDetails offer={offer} />
        {/* Upprepas på kvittot: villkoren är först nu bindande, och det här är
            enda skärmen kunden har kvar när SMS-länken är förbrukad. */}
        <OfferTerms terms={result?.terms || offer?.terms} showConsent={false} />
      </OfferShell>
    );
  }

  if (!offer) {
    return (
      <OfferShell>
        <OfferHeader
          icon={<InfoIcon />}
          tone="neutral"
          title={t("slotOffer.goneTitle")}
          text={error || t("slotOffer.goneText")}
        />
      </OfferShell>
    );
  }

  const errorAlert = error ? (
    <p className="crm-offer__alert" role="alert">
      {error}
    </p>
  ) : null;

  // Upptagen eller av annat skäl inte bokningsbar: bara beskedet, inte hela
  // erbjudandet. Tiden står kvar överstruken så att kunden vet vilken det gällde.
  if (!offer.acceptable) {
    const key = UNAVAILABLE_REASONS.includes(offer.reason) ? offer.reason : "generic";
    const taken = key === "already_filled";
    const slotLine = formatSlotLine(offer, locale);
    return (
      <OfferShell studioName={studioName}>
        <OfferHeader
          icon={<CalendarOffIcon />}
          tone={taken ? "danger" : "neutral"}
          badge={
            <Badge tone={taken ? "danger" : "neutral"}>{t(`slotOffer.unavailable.${key}.badge`)}</Badge>
          }
          title={t(`slotOffer.unavailable.${key}.title`)}
          text={t(`slotOffer.unavailable.${key}.text`)}
        />
        {slotLine ? (
          <p className="crm-offer__gone-slot">
            <span>{t("slotOffer.goneSlotLabel")}</span> <s>{slotLine}</s>
          </p>
        ) : null}
        {errorAlert}
        <UnsubscribeFooter onUnsubscribe={handleUnsubscribe} />
      </OfferShell>
    );
  }

  const firstName = String(offer.customerName || "").trim().split(/\s+/)[0];
  const greeting = firstName
    ? t("slotOffer.greeting", { name: firstName })
    : t("slotOffer.greetingFallback");
  const intro = studioName
    ? t("slotOffer.introStudio", { studio: studioName })
    : t("slotOffer.intro");

  return (
    <OfferShell studioName={studioName}>
      <OfferHeader
        icon={<CalendarIcon />}
        badge={<Badge tone="info">{t("slotOffer.badgeOpen")}</Badge>}
        title={t("slotOffer.eyebrow")}
        text={`${greeting} ${intro}`}
      />

      <SlotDetails offer={offer} />
      <OfferTerms terms={offer.terms} />
      <button
        type="button"
        className="crm-offer__button"
        onClick={handleAccept}
        disabled={accepting}
      >
        {accepting ? t("slotOffer.accepting") : t("slotOffer.accept")}
      </button>
      <p className="crm-offer__hint">{t("slotOffer.firstComeNote")}</p>
      {errorAlert}
      <UnsubscribeFooter onUnsubscribe={handleUnsubscribe} />
    </OfferShell>
  );
}
