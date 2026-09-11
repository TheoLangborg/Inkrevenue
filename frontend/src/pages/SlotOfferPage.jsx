import { useCallback, useEffect, useState } from "react";
import { buildPageTitle, usePageMetadata } from "../utils/pageMetadata";
import { buildSlotOfferTermsView } from "../utils/slotOfferTerms";
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

function formatReadableTime(value, fallback) {
  if (fallback) return fallback;
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm"
  });
}

function formatDuration(minutes) {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} minuter`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} timmar`;
}

/**
 * Villkoren, i klartext, ovanför knappen (punkt 14).
 *
 * Texterna byggs i `slotOfferTerms.js` — den är ren och testad, det här är bara
 * uppställningen.
 */
function OfferTerms({ terms, showConsent = true }) {
  const rows = buildSlotOfferTermsView(terms);

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
        <p className="slot-offer__terms-note">
          Genom att tacka ja godkänner du studions villkor ovan.
        </p>
      ) : null}
    </div>
  );
}

// Varför erbjudandet inte går att ta, i klartext.
const UNAVAILABLE_REASONS = {
  already_filled: "Någon annan hann tacka ja före dig.",
  slot_closed: "Tiden är inte längre tillgänglig.",
  offer_expired: "Erbjudandet har gått ut.",
  offer_revoked: "Det här erbjudandet gäller inte längre.",
  slot_in_past: "Tiden har redan passerat.",
  // Studion kräver ett minsta varsel — tiden finns kvar, men inte via länken.
  too_soon: "Tiden börjar för snart för att bokas här. Ring studion om du ändå vill ta den."
};

export function SlotOfferPage({ token }) {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [unsubscribed, setUnsubscribed] = useState(false);

  usePageMetadata({
    title: buildPageTitle("Din tid"),
    description: "Tacka ja till en tid som blivit ledig."
  });

  const load = useCallback(async () => {
    try {
      const data = await getSlotOffer(token);
      setOffer(data);
    } catch (loadError) {
      setError(loadError.message || "Länken gäller inte längre.");
    } finally {
      setLoading(false);
    }
  }, [token]);

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
      setError(acceptError.message || "Tiden gick tyvärr inte att boka.");
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
      setError(unsubscribeError.message || "Kunde inte avregistrera dig.");
    }
  }

  if (loading) {
    return (
      <main className="slot-offer">
        <p className="slot-offer__loading">Hämtar tiden…</p>
      </main>
    );
  }

  if (unsubscribed) {
    return (
      <main className="slot-offer">
        <div className="slot-offer__card">
          <h1 className="slot-offer__title">Avregistrerad</h1>
          <p className="slot-offer__note">
            Du får inga fler SMS om lediga tider. Hör av dig till studion om du ändrar dig.
          </p>
        </div>
      </main>
    );
  }

  if (result?.booked) {
    return (
      <main className="slot-offer">
        <div className="slot-offer__card slot-offer__card--done">
          <div className="slot-offer__check" aria-hidden="true">✓</div>
          <h1 className="slot-offer__title">Tiden är din</h1>
          <p className="slot-offer__time">{formatReadableTime(result.startTime, result.readableTime)}</p>
          <p className="slot-offer__note">
            Studion har fått din bokning. Du får en bekräftelse inom kort.
          </p>
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
          <h1 className="slot-offer__title">Länken gäller inte längre</h1>
          <p className="slot-offer__note">{error || "Erbjudandet finns inte kvar."}</p>
        </div>
      </main>
    );
  }

  const unavailableReason = offer.acceptable ? null : UNAVAILABLE_REASONS[offer.reason];

  return (
    <main className="slot-offer">
      <div className="slot-offer__card">
        <p className="slot-offer__eyebrow">En tid har blivit ledig</p>
        <h1 className="slot-offer__title">
          Hej {String(offer.customerName || "").split(/\s+/)[0]}!
        </h1>

        <p className="slot-offer__time">
          {formatReadableTime(offer.startTime, offer.readableTime)}
        </p>

        <p className="slot-offer__meta">
          {formatDuration(offer.durationMinutes)}
          {offer.artistName ? ` hos ${offer.artistName}` : ""}
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
              {accepting ? "Bokar…" : "Ja tack, jag tar tiden"}
            </button>
            <p className="slot-offer__note">
              Först till kvarn — tiden är din så fort du tackat ja.
            </p>
          </>
        ) : (
          <p className="slot-offer__note slot-offer__note--warning">
            {unavailableReason || "Tiden går tyvärr inte att boka längre."}
          </p>
        )}

        {error && <p className="slot-offer__note slot-offer__note--warning">{error}</p>}

        {/* Opt-out. Måste finnas här: ett alfanumeriskt SMS-avsändarnamn kan inte
            ta emot STOPP-svar, så det här är kundens enda självbetjäningsväg ut. */}
        <button type="button" className="slot-offer__unsubscribe" onClick={handleUnsubscribe}>
          Jag vill inte ha fler tidserbjudanden
        </button>
      </div>
    </main>
  );
}
