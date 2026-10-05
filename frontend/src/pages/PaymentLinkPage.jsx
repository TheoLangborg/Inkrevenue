import { useCallback, useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { buildPageTitle, usePageMetadata } from "../utils/pageMetadata";
import { createPaymentLinkIntent, getPaymentLink } from "../services/publicSiteApi";
import { createTranslator, useLanguage } from "../i18n/LanguageContext";
import { LOCALES } from "../i18n/config";

/**
 * Betalsidan (/betala/:token). Kunden kommer hit från en länk i mejl eller SMS
 * efter att studion bokat tiden, och betalar förskottet med kort.
 *
 * Ordningen är poängen: tiden och beloppet först, sedan reglerna med en
 * kryssruta som krävs, och först därefter kortformuläret. Servern sparar
 * godkännandet (text och version) innan betalningen skapas — det är beviset om
 * betalningen bestrids. Beloppet kommer alltid från servern.
 *
 * Sidan visas på kundens språk. Länken bär inget språkprefix, så utan /en i
 * adressen gäller språket kunden fyllde i formuläret på.
 */

function formatDateTime(value, locale) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm"
  });
}

// Lägen där det inte finns något att betala: rubrik och text per läge.
const CLOSED_STATES = {
  paid: ["paymentPage.alreadyPaidTitle", "paymentPage.alreadyPaidText"],
  expired: ["paymentPage.expiredTitle", "paymentPage.expiredText"],
  cancelled: ["paymentPage.cancelledTitle", "paymentPage.cancelledText"],
  closed: ["paymentPage.closedTitle", "paymentPage.closedText"],
  unavailable: ["paymentPage.unavailableTitle", "paymentPage.unavailableText"]
};

// --- Kortsteget, renderas inne i <Elements> ---
function CardStep({ amountSek, onPaid, onBack, t }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    if (!stripe || !elements || paying) return;
    setPaying(true);
    setError("");

    // Inget return_url med flit: intenten skapas med bara kort
    // (BOOKING_PAYMENT_METHOD_TYPES i CRM:ets stripeConnectService.js), och
    // kortets 3D Secure körs i en modal, aldrig som en omdirigering. Samma
    // regel som kortsteget i bokningsformuläret.
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required"
    });

    if (confirmError) {
      setError(confirmError.message || t("paymentPage.payFailed"));
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onPaid();
      return;
    }

    setError(t("paymentPage.payUnconfirmed"));
    setPaying(false);
  }

  return (
    <div className="form-payment-step">
      <div className="form-payment-step-header">
        <strong>{t("paymentPage.payHeading", { amount: amountSek })}</strong>
        <span>{t("paymentPage.paySecure")}</span>
      </div>
      <PaymentElement />
      {error ? <p className="form-payment-step-error">{error}</p> : null}
      <div className="form-payment-step-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={paying}>
          {t("paymentPage.back")}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePay}
          disabled={!stripe || paying}
        >
          {paying ? t("paymentPage.paying") : t("paymentPage.payButton", { amount: amountSek })}
        </button>
      </div>
    </div>
  );
}

export function PaymentLinkPage({ token }) {
  const { language: urlLanguage } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [intent, setIntent] = useState(null);
  const [paid, setPaid] = useState(false);

  // /en/betala/… går före; annars kundens eget språk från förfrågan.
  const language = urlLanguage === "en" || summary?.language === "en" ? "en" : "sv";
  const { t } = useMemo(() => createTranslator(language), [language]);
  const locale = LOCALES[language];

  usePageMetadata({
    title: buildPageTitle(t("paymentPage.metaTitle")),
    description: t("paymentPage.metaDescription"),
    noIndex: true
  });

  const load = useCallback(async () => {
    try {
      setSummary(await getPaymentLink(token));
      setLoadError("");
    } catch (error) {
      setLoadError(error.message || "");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const stripePromise = useMemo(() => {
    const key = intent?.publishableKey || summary?.stripe?.publishableKey;
    const accountId = intent?.accountId || summary?.stripe?.accountId;
    return key && accountId ? loadStripe(key, { stripeAccount: accountId }) : null;
  }, [intent?.publishableKey, intent?.accountId, summary?.stripe?.publishableKey, summary?.stripe?.accountId]);

  async function handleContinue() {
    if (!accepted || starting) return;
    setStarting(true);
    setStartError("");

    try {
      const data = await createPaymentLinkIntent(token, {
        acceptedPolicyVersion: summary.policy?.version || "",
        language
      });
      setIntent(data);
    } catch (error) {
      setStartError(error.message || t("paymentPage.startFailed"));
      // 409 = läget har ändrats (betald, utgången, avbokad). Läs om sidan så att
      // knappen inte ligger kvar och lockar till fler försök.
      if (error.status === 409) {
        await load();
      }
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <main className="slot-offer">
        <p className="slot-offer__loading">{t("paymentPage.loading")}</p>
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="slot-offer">
        <div className="slot-offer__card">
          <h1 className="slot-offer__title">{t("paymentPage.notFoundTitle")}</h1>
          <p className="slot-offer__note">{loadError || t("paymentPage.notFoundText")}</p>
        </div>
      </main>
    );
  }

  const studioName = summary.studio?.name || "";
  const amountSek = intent?.amountSek ?? summary.prepayment?.amountSek ?? 0;

  if (paid) {
    return (
      <main className="slot-offer">
        <div className="slot-offer__card slot-offer__card--done">
          <div className="slot-offer__check" aria-hidden="true">✓</div>
          <h1 className="slot-offer__title">{t("paymentPage.paidTitle")}</h1>
          <p className="slot-offer__time">{formatDateTime(summary.booking?.startTime, locale)}</p>
          <p className="slot-offer__note">
            {t("paymentPage.paidText", { studio: studioName, amount: amountSek })}
          </p>
        </div>
      </main>
    );
  }

  const policyLines = summary.policy?.[language] || summary.policy?.sv || [];
  const closed = CLOSED_STATES[summary.state];
  const amountLabel = t(
    summary.prepayment?.kind === "deposit"
      ? "paymentPage.amountLabelDeposit"
      : "paymentPage.amountLabelBookingFee"
  );

  return (
    <main className="slot-offer">
      <div className="slot-offer__card payment-link">
        {summary.studio?.logoUrl ? (
          <img className="payment-link__logo" src={summary.studio.logoUrl} alt={studioName} />
        ) : null}
        <p className="slot-offer__eyebrow">{studioName}</p>
        <h1 className="slot-offer__title">
          {summary.customerFirstName
            ? t("paymentPage.greeting", { name: summary.customerFirstName })
            : t("paymentPage.greetingFallback")}
        </h1>

        <p className="slot-offer__note payment-link__intro">
          {t("paymentPage.intro", { studio: studioName })}
        </p>
        <p className="slot-offer__time">{formatDateTime(summary.booking?.startTime, locale)}</p>
        <p className="slot-offer__meta">
          {summary.booking?.typeLabel?.[language] || summary.booking?.typeLabel?.sv || ""}
        </p>
        {summary.booking?.consultationMinutes > 0 ? (
          <p className="slot-offer__note payment-link__consultation">
            {t("paymentPage.consultationFirst", { minutes: summary.booking.consultationMinutes })}
          </p>
        ) : null}

        {closed ? (
          <>
            <h2 className="payment-link__state-title">{t(closed[0])}</h2>
            <p className="slot-offer__note">{t(closed[1])}</p>
          </>
        ) : (
          <>
            <div className="payment-link__amount">
              <span>{amountLabel}</span>
              <strong>{amountSek} kr</strong>
            </div>
            {summary.expiresAt ? (
              <p className="slot-offer__note payment-link__until">
                {t("paymentPage.payUntil", { date: formatDateTime(summary.expiresAt, locale) })}
              </p>
            ) : null}

            {policyLines.length ? (
              <div className="slot-offer__terms">
                <p className="payment-link__policy-heading">{t("paymentPage.policyHeading")}</p>
                <ul className="payment-link__policy">
                  {policyLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {intent?.clientSecret && stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: intent.clientSecret,
                  locale: language,
                  appearance: { theme: "stripe", variables: { colorPrimary: "#e07b3c" } }
                }}
              >
                <CardStep
                  amountSek={amountSek}
                  t={t}
                  onPaid={() => setPaid(true)}
                  onBack={() => setIntent(null)}
                />
              </Elements>
            ) : (
              <>
                <label className="payment-link__accept">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)}
                  />
                  <span>{t("paymentPage.acceptLabel")}</span>
                </label>
                <button
                  type="button"
                  className="slot-offer__button"
                  onClick={handleContinue}
                  disabled={!accepted || starting}
                >
                  {starting
                    ? t("paymentPage.preparing")
                    : t("paymentPage.continueButton", { amount: amountSek })}
                </button>
              </>
            )}

            {startError ? (
              <p className="slot-offer__note slot-offer__note--warning">{startError}</p>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
