import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { FormLegalLinks } from "./FormLegalLinks";
import { CustomSelect } from "./CustomSelect";
import { useLegalConsent } from "../contexts/LegalConsentContext";
import {
  createPublicStudioLead,
  createStudioPaymentIntent,
  previewPublicStudioBooking
} from "../services/publicSiteApi";
import { useAbandonedFormDraft } from "../hooks/useAbandonedFormDraft";
import { getLeadSourceFromUrl, getTrackingPayload } from "../utils/tracking";
import { prepareLeadImageUpload, MAX_INSPIRATION_IMAGE_MB } from "../utils/prepareLeadImageUpload";
import { canBookDirectly, resolveTimeStepNotice } from "../utils/leadFormBooking";
import { STUDIO_TIME_ZONE } from "../utils/campaignBanner";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { CampaignBanner } from "./CampaignBanner";
import { sv } from "../i18n/sv";
import { translateOptionLabel } from "../i18n/optionLabels";

// Sentinelvärde för "Annat" i stil-dropdownen. Väljs det byter formuläret till
// konsultation eftersom studion inte har en tidsberäkning för stilen.
const OTHER_STYLE_VALUE = "__other__";
const OTHER_PLACEMENT_VALUE = "__other_placement__";

// CRM:et märker varje fel som kommer ur inspirationsbilden med den här koden
// (createImageError i publicLeadUploadService). Koden — inte feltexten — är det
// som avgör om vi erbjuder kunden att skicka utan bilden.
const INSPIRATION_IMAGE_ERROR_CODE = "INSPIRATION_IMAGE_FAILED";

function isInspirationImageError(error) {
  return error?.code === INSPIRATION_IMAGE_ERROR_CODE;
}

/**
 * VIKTIGT om språk i det här formuläret:
 *
 * Etiketterna kunden läser översätts, men VÄRDENA som skickas till CRM:et är
 * alltid svenska. Backendens tidsberäkning (publicLeadBookingBotService) matchar
 * svenska nyckelord som delsträngar i stil- och storlekstexten — skickar vi
 * "Very small (up to 5 cm)" faller estimatet tyst tillbaka på fel tid.
 * Därför byggs värden alltid ur den svenska ordboken.
 */

// Reservlista om studion saknar konfigurerade modifierare/stilar, så att
// dropdownen aldrig blir tom.
function buildFallbackStyleOptions(tList) {
  const labels = tList("leadForm.fallbackStyles");
  return sv.leadForm.fallbackStyles.map((value, index) => ({
    label: labels[index] || value,
    value
  }));
}

// Bygger dropdown-alternativen från studions data. Föredrar styleOptions
// (modifierarnas labels från backend), faller tillbaka på studio.styles och
// därefter en reservlista.
function buildStyleOptions(studio, tList, language) {
  const fromModifiers = Array.isArray(studio?.styleOptions)
    ? studio.styleOptions
        .map((option) => {
          if (typeof option === "string") {
            const value = option.trim();
            return value ? { label: value, value } : null;
          }
          const value = String(option?.value || option?.label || "").trim();
          const label = String(option?.label || value).trim();
          if (!value) return null;
          // Etiketten översätts, värdet lämnas orört — se kommentaren överst.
          return {
            label: translateOptionLabel("style", option?.builtInKey, label || value, language),
            value
          };
        })
        .filter(Boolean)
    : [];

  if (fromModifiers.length > 0) return fromModifiers;

  const fromStyles = Array.isArray(studio?.styles)
    ? studio.styles
        .map((style) => String(style || "").trim())
        .filter(Boolean)
        .map((style) => ({ label: style, value: style }))
    : [];

  if (fromStyles.length > 0) return fromStyles;

  return buildFallbackStyleOptions(tList);
}

// Placeringar studion valt i sina bokningsregler. Saknas de får kunden skriva
// fritt som förut — ingen studio ska tvingas fylla i listan för att formuläret
// ska funka.
function buildPlacementOptions(studio, language) {
  const options = Array.isArray(studio?.placementOptions)
    ? studio.placementOptions
        .map((option) => {
          if (typeof option === "string") {
            const value = option.trim();
            return value ? { label: value, value } : null;
          }
          const value = String(option?.value || option?.label || "").trim();
          const label = String(option?.label || value).trim();
          if (!value) return null;
          // Etiketten översätts, värdet lämnas orört — se kommentaren överst.
          return {
            label: translateOptionLabel("placement", option?.builtInKey, label || value, language),
            value
          };
        })
        .filter(Boolean)
    : [];

  return options.length ? options : null;
}

const baseForm = {
  name: "",
  email: "",
  phone: "",
  bookingType: "tattoo_session",
  tattooStyle: "",
  placement: "",
  size: "",
  budget: "",
  description: "",
  website: "",
  preferredSlots: [],
  requestedDurationMinutes: ""
};

function buildInitialForm() {
  return { ...baseForm };
}

function createAvailabilityState(overrides = {}) {
  return { state: "idle", message: "", data: null, ...overrides };
}

function parseDateKey(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeeks(availabilityData, { locale, weekdayLabels }) {
  const startDate = parseDateKey(availabilityData?.startDate);
  if (!startDate) return [];
  const availableDates = new Map(
    (availabilityData?.dates || []).map((d) => [d.date, d])
  );
  const daysToShow = Math.max(1, Number.parseInt(String(availabilityData?.days || ""), 10) || 1);
  const endDate = addDays(startDate, daysToShow - 1);
  const weeks = [];
  let weekCursor = getWeekStart(startDate);
  while (weekCursor <= endDate) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekCursor, i);
      const key = formatDateKey(d);
      const entry = availableDates.get(key) || null;
      const inRange = d >= startDate && d <= endDate;
      days.push({
        key,
        date: key,
        dayNumber: d.getDate(),
        weekdayLabel: weekdayLabels[i],
        monthLabel: d.toLocaleDateString(locale, { day: "numeric", month: "short" }),
        inRange,
        slots: entry?.slots || [],
        isAvailable: inRange && (entry?.slots?.length || 0) > 0
      });
    }
    weeks.push({ key: formatDateKey(weekCursor), days });
    weekCursor = addDays(weekCursor, 7);
  }
  return weeks;
}

function buildSizeOptions(studio, t) {
  const thresholds = studio?.bookingFlow?.estimatorSummary?.sizeThresholds;
  if (!thresholds) return null;

  const { tinyMaxCentimeters, smallMaxCentimeters, mediumMaxCentimeters, largeMaxCentimeters } = thresholds;

  // Bygg storleks-tiers utifrån studions cm-trösklar (satta i bokningsreglerna).
  //
  // value = alltid den svenska texten. Backendens estimator matchar "mycket
  //   liten"/"mellanstor"/"extra stor" som delsträngar — översatta värden gör
  //   att tidsberäkningen tyst hamnar fel. Rör därför INTE sizeTiny m.fl. i
  //   i18n-filerna; det är de som bygger value.
  // label = kort namn ("Mycket liten"), det enda som får plats i den stängda
  //   väljaren i en tvåkolumnsrad.
  // meta = cm-intervallet, visas bredvid namnet i listan (desktop) och läggs
  //   till inom parentes i native <select> (mobil, där fältet är fullbrett).
  const options = [];
  const push = (key, cm, rangeKey) => {
    const vars = { cm };
    options.push({
      value: interpolateSwedish(key, vars),
      label: t(`leadForm.${key}Name`),
      meta: t(`leadForm.${rangeKey}`, vars)
    });
  };

  if (tinyMaxCentimeters > 0) {
    push("sizeTiny", tinyMaxCentimeters, "sizeRangeUpTo");
  }
  if (smallMaxCentimeters > 0 && smallMaxCentimeters > tinyMaxCentimeters) {
    push("sizeSmall", smallMaxCentimeters, "sizeRangeUpTo");
  }
  if (mediumMaxCentimeters > 0 && mediumMaxCentimeters > smallMaxCentimeters) {
    push("sizeMedium", mediumMaxCentimeters, "sizeRangeUpTo");
  }
  if (largeMaxCentimeters > 0 && largeMaxCentimeters > mediumMaxCentimeters) {
    push("sizeLarge", largeMaxCentimeters, "sizeRangeUpTo");
  }

  // Största tröskeln som finns blir undre gräns för "extra stor".
  const largestThreshold = [largeMaxCentimeters, mediumMaxCentimeters, smallMaxCentimeters, tinyMaxCentimeters]
    .find((cm) => cm > 0);

  if (largestThreshold) {
    push("sizeExtra", largestThreshold, "sizeRangeOver");
  } else {
    options.push({
      value: sv.leadForm.sizeExtraNoThreshold,
      label: t("leadForm.sizeExtraName"),
      meta: t("leadForm.sizeRangeNoThreshold")
    });
  }

  return options.length >= 2 ? options : null;
}

// Samma {{cm}}-interpolation som t(), men alltid mot den svenska ordboken —
// används för värden som måste förbli svenska oavsett gränssnittsspråk.
function interpolateSwedish(key, vars) {
  return String(sv.leadForm[key] || "").replace(/\{\{(\w+)\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

function hasEnoughDetailsForCalendar(formData) {
  if (formData.bookingType === "consultation") {
    return Boolean(String(formData.description || "").trim());
  }
  return Boolean(
    String(formData.tattooStyle || "").trim() &&
      String(formData.placement || "").trim() &&
      String(formData.size || "").trim() &&
      String(formData.description || "").trim()
  );
}

// Stil, placering och storlek göms när kunden byter till konsultation, men de
// ligger kvar i state så att ett byte tillbaka inte tömmer fälten. Allt som
// LÄMNAR formuläret måste därför läsa detaljerna härifrån — annars följer
// värden kunden övergav med i submit och tidsätter konsultationen efter en
// storlek som inte längre gäller.
function getLeadDetailFields(formData) {
  const isConsultation = formData.bookingType === "consultation";

  return {
    tattooStyle: isConsultation ? "" : formData.tattooStyle,
    placement: isConsultation ? "" : formData.placement,
    size: isConsultation ? "" : formData.size
  };
}

// Förhandsvisningen kostar ett anrop per körning och har ett eget tak per minut
// i backenden (punkt 9). Strukturerade fält byts med ett klick och ska kännas
// direkt; beskrivningen skrivs tecken för tecken och tål att vänta längre.
const PREVIEW_DEBOUNCE_MS = 300;
const DESCRIPTION_PREVIEW_DEBOUNCE_MS = 800;

const PREVIEW_PAYLOAD_FIELDS = [
  "bookingType",
  "tattooStyle",
  "placement",
  "size",
  "budget",
  "description"
];

function sameLeadPreviewPayload(a, b) {
  return PREVIEW_PAYLOAD_FIELDS.every(
    (field) => String(a?.[field] ?? "") === String(b?.[field] ?? "")
  );
}

function clearRequestedTimeSelection(currentFormData, requestedDurationMinutes = "") {
  return {
    ...currentFormData,
    preferredSlots: [],
    requestedDurationMinutes: String(requestedDurationMinutes || "")
  };
}

function computeFieldError(name, formData, t) {
  const isConsultation = formData.bookingType === "consultation";
  switch (name) {
    case "tattooStyle":
      if (isConsultation) return "";
      return !formData.tattooStyle.trim() ? t("leadForm.errorStyle") : "";
    case "placement":
      if (isConsultation) return "";
      return !formData.placement.trim() ? t("leadForm.errorPlacement") : "";
    case "size":
      if (isConsultation) return "";
      return !formData.size.trim() ? t("leadForm.errorSize") : "";
    case "description":
      return !formData.description.trim()
        ? isConsultation
          ? t("leadForm.errorDescriptionConsultation")
          : t("leadForm.errorDescriptionTattoo")
        : "";
    case "name":
      return formData.name.trim().length < 2 ? t("leadForm.errorName") : "";
    case "email":
      if (!formData.email.trim() && !formData.phone.trim()) {
        return t("leadForm.errorContact");
      }
      if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        return t("leadForm.errorEmail");
      }
      return "";
    default:
      return "";
  }
}

const STEP_TATTOO_FIELDS = ["tattooStyle", "placement", "size", "description"];
const STEP_CONTACT_FIELDS = ["name", "email"];

// --- PaymentStep: Stripe-kortformulär, renderas inne i <Elements> ---
function PaymentStep({ amountSek, paymentIntentId, onConfirmed, onCancel, submitting }) {
  const t = useT();
  const stripe = useStripe();
  const elements = useElements();
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState(false);

  async function handlePay() {
    if (!stripe || !elements || paying || submitting) return;
    setPaying(true);
    setPayError("");

    // Inget `return_url`, och det är avsiktligt: PaymentIntenten skapas med en
    // låst metodlista (BOOKING_PAYMENT_METHOD_TYPES i tattoo-crm:s
    // stripeConnectService.js) som bara innehåller kort, och kortets 3D Secure
    // körs i en modal — aldrig som en omdirigering. Öppnas listan för Klarna,
    // Swish eller något annat omdirigerande betalsätt kastar Stripe.js
    // "You must provide a return_url" rakt in i setPayError här nedanför, och
    // kunden kan inte betala alls. Då krävs `confirmParams: { return_url }`
    // OCH en returväg som läser `payment_intent` ur query-strängen och kör
    // registerPaidLead — bara det ena räcker inte.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required"
    });

    if (error) {
      setPayError(error.message || t("leadForm.payFailed"));
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        await onConfirmed(paymentIntent.id);
      } catch {
        setPaying(false);
      }
    } else {
      setPayError(t("leadForm.payUnconfirmed"));
      setPaying(false);
    }
  }

  return (
    <div className="form-payment-step">
      <div className="form-payment-step-header">
        <strong>{t("leadForm.payHeading", { amount: amountSek })}</strong>
        <span>{t("leadForm.paySecure")}</span>
      </div>
      <PaymentElement />
      {payError ? <p className="form-payment-step-error">{payError}</p> : null}
      <div className="form-payment-step-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={paying || submitting}
        >
          {t("common.back")}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePay}
          disabled={!stripe || paying || submitting}
        >
          {paying || submitting
            ? t("leadForm.payProcessing")
            : t("leadForm.payButton", { amount: amountSek })}
        </button>
      </div>
    </div>
  );
}

export function StudioLeadFormEnhanced({
  studio,
  titleText = "",
  introText = "",
  successPreviewText = "",
  previewMode = false,
  // Sätts BARA av /studio-preview/<slug> på marknadssajten, som finns just för
  // att testa formuläret mot en riktig studio i CRM. Alla andra
  // förhandsvisningar ska vara läsbara, inte skarpa.
  allowPreviewSubmit = false
}) {
  const { t, tList, locale, language } = useLanguage();
  const [formData, setFormData] = useState(() => buildInitialForm());
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [availability, setAvailability] = useState(() => createAvailabilityState());
  const [visibleWeekIndex, setVisibleWeekIndex] = useState(0);
  const [inspirationImage, setInspirationImage] = useState(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [imageError, setImageError] = useState("");
  // Sätts när servern svarade att det var inspirationsbilden som fällde
  // inskickningen. Texten lovar att kunden kan försöka igen utan bild — och
  // steg 1, där bilden väljs, är oåtkomligt efter en betalning (Tillbaka-knappen
  // är dold). Utan den här knappen fanns ingen väg vidare alls.
  const [imageUploadRejected, setImageUploadRejected] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [touched, setTouched] = useState(new Set());
  // Sätts när kunden valde "Annat" i stil-dropdownen och vi därför bytte till
  // konsultation, så vi kan förklara varför för kunden.
  const [styleFellBackToConsultation, setStyleFellBackToConsultation] = useState(false);

  const styleOptions = useMemo(
    () => buildStyleOptions(studio, tList, language),
    [studio, tList, language]
  );
  // Stil-listan för dropdownen: studions stilar + ett "Annat" längst ner som
  // växlar till konsultation.
  const styleSelectOptions = useMemo(
    () => [
      ...styleOptions.map((option) => ({ label: option.label, value: option.value })),
      { label: t("leadForm.otherStyle"), value: OTHER_STYLE_VALUE, isOther: true }
    ],
    [styleOptions, t]
  );

  // Placeringar: dropdown när studion listat sina, annars fritext. "Annat" byter
  // till fritext utan att växla bokningstyp — placeringen påverkar bara ett
  // eventuellt tidspåslag, inte om tiden går att beräkna.
  const placementOptions = useMemo(
    () => buildPlacementOptions(studio, language),
    [studio, language]
  );
  const [showCustomPlacement, setShowCustomPlacement] = useState(false);
  const placementSelectOptions = useMemo(
    () =>
      placementOptions
        ? [
            ...placementOptions.map((option) => ({
              label: option.label,
              value: option.value
            })),
            { label: t("leadForm.otherPlacement"), value: OTHER_PLACEMENT_VALUE, isOther: true }
          ]
        : [],
    [placementOptions, t]
  );

  function handlePlacementChange(event) {
    const { value } = event.target;
    if (value === OTHER_PLACEMENT_VALUE) {
      setShowCustomPlacement(true);
      setFormData((current) => ({ ...current, placement: "" }));
      return;
    }
    setShowCustomPlacement(false);
    setFormData((current) => ({ ...current, placement: value }));
  }

  // Stripe Connect state
  const [stripePromise, setStripePromise] = useState(null);
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [paymentReady, setPaymentReady] = useState(false); // true after PaymentIntent created
  // Beloppet som FAKTISKT ligger på PaymentIntenten, enligt servern. Sidladdningens
  // siffra är en förutsägelse: ändrar studion sin deposition medan kunden fyller i
  // formuläret räknar servern om beloppet, och det är servern som bestämmer vad som
  // dras. Kortsteget och kvittensen ska säga samma sak som kortet debiteras.
  const [chargedAmountSek, setChargedAmountSek] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null); // { amountSek, studioName } after confirmed payment
  // Sätts när Stripe-betalningen gått igenom men lead-POST:en misslyckades.
  // Kunden är då redan debiterad, så nästa försök MÅSTE gå med samma
  // paymentIntentId. Nollades det här (som tidigare) hamnade kunden tillbaka på
  // "Betala"-knappen, som skapar en NY PaymentIntent — och drar pengarna igen.
  // Backenden dedupar på paymentRecord.paymentIntentId, så ett omförsök med
  // samma id är ofarligt även om det första försöket hann skriva leadet.
  const [paidPaymentIntentId, setPaidPaymentIntentId] = useState(null);

  // Slugen avgör om det finns en studio att skicka TILL. previewMode avgör om
  // den här sidan FÅR skicka. CRM:ets live-preview renderas mot en riktig slug,
  // så utan den andra halvan kan studion som tittar på sin egen sida skapa ett
  // skarpt lead — och med Stripe Connect på hamna i ett riktigt kortformulär
  // mot sitt eget konto.
  const hasStudioSlug = Boolean(studio?.slug);
  const canSubmit = hasStudioSlug && (!previewMode || allowPreviewSubmit);
  const { hasAcceptedConsent, openLegalModal } = useLegalConsent();
  const fileInputRef = useRef(null);
  const previewRequestIdRef = useRef(0);
  // Punkt 9: förhandsvisningen har ett tak per minut, och varje anrop kör
  // bokningsreglerna hos studion. Skicka därför aldrig samma frågeställning två
  // gånger, och håll koll på om det finns ett tidigare svar att falla tillbaka på.
  const lastPreviewPayloadRef = useRef(null);
  const lastPreviewDataRef = useRef(null);
  const formTopRef = useRef(null);
  const bookingFlow = studio?.bookingFlow;
  // Kalendern hänger på slugen, inte på inskickningen: förhandsvisningen ska
  // visa tidssteget precis som kunden ser det — den ska bara inte kunna boka.
  const canShowCalendar = Boolean(hasStudioSlug && bookingFlow?.enabled);

  const steps = useMemo(() => {
    return [
      { id: "tattoo", label: t("leadForm.stepTattooLabel"), heading: t("leadForm.stepTattooHeading") },
      ...(canShowCalendar
        ? [{ id: "time", label: t("leadForm.stepTimeLabel"), heading: t("leadForm.stepTimeHeading") }]
        : []),
      { id: "contact", label: t("leadForm.stepContactLabel"), heading: t("leadForm.stepContactHeading") }
    ];
  }, [canShowCalendar, t]);

  // Ladda Stripe.js om studion har ett aktivt Connect-konto
  useEffect(() => {
    const pk = studio?.payment?.stripePublishableKey;
    const accountId = studio?.payment?.stripeConnectAccountId;
    if (pk && accountId && !stripePromise) {
      setStripePromise(loadStripe(pk, { stripeAccount: accountId }));
    }
  }, [studio?.payment?.stripePublishableKey, studio?.payment?.stripeConnectAccountId]);

  // needsPayment definieras längre ner — den beror på requiresTimeSelection.

  const bookingTypeForPrepayment = formData.bookingType || "tattoo_session";

  // Vad DEN HÄR bokningstypen kostar i förskott.
  //
  // Studion väljer sort (deposition ELLER bokningsavgift), omfattning
  // (tatuering / konsultation / båda) och kan sätta ett eget belopp för
  // konsultationen. Servern räknar ut resultatet med samma funktion som
  // bokningen och betalvägen använder (resolveCustomerPrepaymentSek) och skickar
  // det per bokningstyp. Formuläret ska ALDRIG härleda det ur flaggorna själv —
  // det var precis så konsultationen kunde debiteras en deposition som bokningen
  // sedan sa "krävs inte" om.
  const prepayment = useMemo(() => {
    const payment = studio?.payment;
    if (!payment) return { kind: null, amountSek: 0 };

    const fromServer = payment.prepaymentByBookingType?.[bookingTypeForPrepayment];
    if (fromServer) {
      return { kind: fromServer.kind || null, amountSek: fromServer.amountSek || 0 };
    }

    // Fallback för en backend som ännu inte skickar kartan (repona deployas var
    // för sig). Speglar det gamla beteendet plus typregeln: depositionen gällde
    // aldrig konsultationer.
    if (payment.depositRequired && bookingTypeForPrepayment !== "consultation") {
      return { kind: "deposit", amountSek: payment.depositAmountSek || 0 };
    }
    if (payment.bookingFeeEnabled) {
      return { kind: "booking_fee", amountSek: payment.bookingFeeAmountSek || 0 };
    }
    return { kind: null, amountSek: 0 };
  }, [studio?.payment, bookingTypeForPrepayment]);

  function getPaymentAmount() {
    return prepayment.amountSek || 0;
  }

  // Finns det en PaymentIntent gäller dess belopp. Före den finns är förutsägelsen
  // det enda vi har — och det är också den knappen som SKAPAR intenten.
  function getChargedAmount() {
    return typeof chargedAmountSek === "number" ? chargedAmountSek : getPaymentAmount();
  }

  const hasEnoughDetails = useMemo(() => hasEnoughDetailsForCalendar(formData), [formData]);
  const draftPayload = useMemo(
    () => ({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      bookingType: formData.bookingType,
      ...getLeadDetailFields(formData),
      budget: formData.budget,
      description: formData.description,
      preferredSlots: formData.preferredSlots,
      preferredStartTime: formData.preferredSlots?.[0]?.startTime || "",
      preferredEndTime: formData.preferredSlots?.[0]?.endTime || "",
      requestedDurationMinutes: formData.requestedDurationMinutes,
      privacyConsent: hasAcceptedConsent,
      marketingConsent: false,
      website: formData.website
    }),
    [formData, hasAcceptedConsent]
  );
  const { draftId, clearDraft } = useAbandonedFormDraft({
    type: "studio_lead",
    studioSlug: studio?.slug || "",
    payload: draftPayload,
    enabled: canSubmit
  });
  const isCheckingAvailability = Boolean(
    canShowCalendar && hasEnoughDetails && availability.state === "loading"
  );
  const weekdayLabels = useMemo(() => tList("leadForm.weekdays"), [tList]);
  const weeks = useMemo(
    () => buildWeeks(availability.data, { locale, weekdayLabels }),
    [availability.data, locale, weekdayLabels]
  );
  const visibleWeek = useMemo(
    () => weeks[visibleWeekIndex] || null,
    [weeks, visibleWeekIndex]
  );
  const hasAvailableSlots = useMemo(
    () => weeks.some((w) => w.days.some((d) => d.slots.length > 0)),
    [weeks]
  );
  // Läs eligibility ur svaret, inte ur availability.state. Med "success" i
  // villkoret slocknade grinden vid varje omhämtning: knappen gick från "Gå
  // till betalning" till "Skicka förfrågan" och rutan skrev "du betalar inget
  // nu" trots vald tid — och den kunden slapp ifrån depositionen.
  //
  // "stale" är undantaget (granskning 4 punkt 2) — se canBookDirectly för hela
  // motiveringen: luckorna som står kvar efter ett misslyckat omhämtningsförsök
  // är dimensionerade av det GAMLA estimatet, medan inskicket bär den nya
  // beskrivningen. Grinden bor i utils för att gå att köra som test.
  const requiresTimeSelection = canBookDirectly({
    canShowCalendar,
    hasEnoughDetails,
    availabilityState: availability.state,
    eligibleForDirectBooking: availability.data?.eligibleForDirectBooking,
    hasSlots: hasAvailableSlots
  });
  // Granskning 4 punkt 3: vilken förklaring tidssteget ska visa. Utan den här
  // blev steget helt tomt så fort kalendern saknade luckor. Logiken ligger i
  // utils för att gå att köra som test.
  const timeStepNotice = resolveTimeStepNotice({
    availabilityState: availability.state,
    hasSlots: hasAvailableSlots,
    eligibleForDirectBooking: availability.data?.eligibleForDirectBooking
  });

  // Punkt 12: ta bara betalt när en tid faktiskt bokas. Backenden skapar bara en
  // bokning när bokningsreglerna landar i ready_to_schedule OCH förfrågan bär ett
  // tidsfönster (publicLeadBookingBotService.js). Går ingen direktbokning —
  // manuell granskning, avstängt bokningsflöde eller ingen vald tid — tas ingen
  // betalning: förfrågan landar som en vanlig lead och studion begär
  // depositionen när de bekräftar tiden.
  const prepaymentConfigured = Boolean(prepayment.kind);
  const willBookDirectly = Boolean(
    requiresTimeSelection && (formData.preferredSlots?.length || 0) > 0
  );
  const needsPayment = Boolean(
    studio?.payment?.stripeConnectReady && prepaymentConfigured && willBookDirectly
  );

  useEffect(() => {
    previewRequestIdRef.current += 1;
    lastPreviewPayloadRef.current = null;
    lastPreviewDataRef.current = null;
    setFormData(buildInitialForm());
    setStatus({ state: "idle", message: "" });
    setAvailability(createAvailabilityState());
    setVisibleWeekIndex(0);
    setInspirationImage(null);
    setCurrentStep(0);
    setTouched(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [studio?.slug]);

  useEffect(() => {
    previewRequestIdRef.current += 1;
    if (!canShowCalendar) {
      lastPreviewPayloadRef.current = null;
      lastPreviewDataRef.current = null;
      setAvailability(createAvailabilityState());
      setVisibleWeekIndex(0);
      return;
    }
    if (!hasEnoughDetails) {
      lastPreviewPayloadRef.current = null;
      lastPreviewDataRef.current = null;
      setAvailability(createAvailabilityState());
      setVisibleWeekIndex(0);
      setFormData((current) => clearRequestedTimeSelection(current));
      return;
    }

    const payload = {
      bookingType: formData.bookingType,
      ...getLeadDetailFields(formData),
      budget: formData.budget,
      description: formData.description
    };
    const previousPayload = lastPreviewPayloadRef.current;

    // Samma frågeställning som sist ger samma svar. Effekten körs om på fler
    // saker än vad estimatet faktiskt beror på (t.ex. språkbyte), och varje
    // överflödigt anrop äter av taket per minut.
    if (previousPayload && sameLeadPreviewPayload(previousPayload, payload)) {
      // Ingen ny hämtning behövs — men körningen som satte "loading" är redan
      // avlivad av sin egen cleanup, så det finns varken timer eller anrop kvar
      // som kan ta oss ur det läget. Ändrar kunden ett fält och ångrar sig innan
      // debouncen löpt ut hamnar vi här, och utan återställningen fastnar
      // formuläret i "Kontrollerar tillgänglighet…" med "Nästa" utgråad för
      // gott. Refen pekar bara på en payload vars svar faktiskt användes (se
      // cleanupen), så lastPreviewDataRef hör ihop med just den här payloaden.
      setAvailability((current) =>
        current.state === "loading"
          ? createAvailabilityState({ state: "success", data: lastPreviewDataRef.current })
          : current
      );
      return;
    }

    // Ändras BARA beskrivningen skriver kunden — vänta längre. Ändras ett
    // strukturerat fält (typ, storlek, placering) är det ett klick, och där
    // ska kalendern uppdateras direkt.
    const debounceMs =
      previousPayload &&
      sameLeadPreviewPayload(
        { ...previousPayload, description: "" },
        { ...payload, description: "" }
      )
        ? DESCRIPTION_PREVIEW_DEBOUNCE_MS
        : PREVIEW_DEBOUNCE_MS;

    // Punkt 7: gå till "loading" redan när debounce-timern startar, inte när
    // anropet går. Under debouncen (300 ms för strukturerade fält, 800 ms efter
    // en ändring i beskrivningen) låg läget annars kvar på "idle", och då var
    // både isCheckingAvailability och requiresTimeSelection false: två snabba
    // klick på "Nästa" tog kunden till kontaktsteget utan att kalendern ritats,
    // förfrågan gick in utan tid och direktbokningen föll tyst bort.
    setAvailability((current) =>
      createAvailabilityState({
        state: "loading",
        message: t("leadForm.checkingAvailability"),
        // Behåll förra svaret. Nollades det föll requiresTimeSelection till
        // false mitt i flödet, och då slog både steg 2-spärren och
        // betalgrinden om utan att något faktiskt hade ändrats.
        data: current.data
      })
    );

    let active = true;
    let applied = false;
    const timeoutId = setTimeout(() => {
      lastPreviewPayloadRef.current = payload;
      previewPublicStudioBooking(studio.slug, payload)
        .then((response) => {
          if (!active) return;
          applied = true;
          lastPreviewDataRef.current = response;
          setAvailability(createAvailabilityState({ state: "success", data: response }));
          setVisibleWeekIndex(0);
          setFormData((current) => {
            // A changed estimate resizes every slot. Keeping a selection whose
            // startTime survived but whose endTime came from the previous
            // estimate submitted a window with the wrong length, and the
            // backend then sent the request to manual review for a duration
            // mismatch. Re-read the kept selection from the fresh response so
            // endTime, durationMinutes and label all come from this estimate.
            const freshSlotsByStartTime = new Map(
              (response?.dates || []).flatMap((d) =>
                (d.slots || []).map((slot) => [slot.startTime, slot])
              )
            );
            const stillValid = (current.preferredSlots || [])
              .map((slot) => freshSlotsByStartTime.get(slot.startTime))
              .filter(Boolean)
              .map((slot) => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
                durationMinutes: slot.durationMinutes,
                label: slot.label
              }));
            return {
              ...current,
              preferredSlots: stillValid,
              requestedDurationMinutes: String(
                stillValid[0]?.durationMinutes ||
                  response?.suggestedDurationMinutes ||
                  current.requestedDurationMinutes ||
                  ""
              )
            };
          });
        })
        .catch((error) => {
          if (!active) return;
          applied = true;
          // Ett misslyckat anrop ska kunna göras om — annars hoppas nästa
          // körning över som "samma payload".
          lastPreviewPayloadRef.current = null;

          const previousData = lastPreviewDataRef.current;

          // Punkt 9: ett 429 (eller vilket nätverksfel som helst) slog ut hela
          // tidssteget — kalendern försvann och kunden stod med ett rött fel
          // och ingen väg vidare. Finns ett tidigare svar behålls det: kalendern
          // står kvar och kunden väljer om på ett klick.
          //
          // Urvalet måste ändå bort. Beskrivningen påverkar estimatet
          // (publicLeadBookingBotService.js), så en tid som var rätt längd före
          // ändringen kan vara fel längd efter den — och backenden skickar då
          // förfrågan till manuell granskning EFTER att depositionen dragits.
          // Behåll hellre kalendern än tiden.
          setAvailability(
            previousData
              ? createAvailabilityState({
                  state: "stale",
                  message: t("leadForm.availabilityStale"),
                  data: previousData
                })
              : createAvailabilityState({
                  state: "error",
                  message: error.message || t("leadForm.availabilityError")
                })
          );
          setFormData((current) => clearRequestedTimeSelection(current));
        });
    }, debounceMs);
    return () => {
      active = false;
      clearTimeout(timeoutId);
      // Hann anropet gå i väg men svaret kastas (active === false)? Då får
      // dedupen inte tro att payloaden redan är hämtad. Annars: kunden ändrar
      // ett fält och ångrar sig — nästa körning hoppar över som "samma
      // payload", ingen timer och inget anrop finns kvar, och availability
      // för alltid kvar i "loading" med "Nästa" utgråad. Har timern inte
      // hunnit fyra av pekar refen fortfarande på förra payloaden och rörs inte.
      if (!applied && lastPreviewPayloadRef.current === payload) {
        lastPreviewPayloadRef.current = null;
      }
    };
  }, [
    canShowCalendar,
    hasEnoughDetails,
    studio?.slug,
    // Typbytet ändrar både vilka detaljer som skickas och hur lång tiden blir,
    // så förhandsvisningen måste hämtas om.
    formData.bookingType,
    formData.tattooStyle,
    formData.placement,
    formData.size,
    formData.budget,
    formData.description,
    t
  ]);


  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  // Stil väljs i en dropdown. Väljer kunden "Annat" (stilen finns inte hos
  // studion) byter vi till konsultation eftersom det inte går att tidsberäkna,
  // och visar en förklaring. Annars sätts stilen som vanligt.
  function handleStyleChange(event) {
    const { value } = event.target;
    if (value === OTHER_STYLE_VALUE) {
      setFormData((current) => ({
        ...current,
        bookingType: "consultation",
        tattooStyle: ""
      }));
      setStyleFellBackToConsultation(true);
      setTouched(new Set());
      return;
    }
    setStyleFellBackToConsultation(false);
    setFormData((current) => ({ ...current, tattooStyle: value }));
  }

  function handleBlur(event) {
    const { name } = event.target;
    setTouched((prev) => new Set([...prev, name]));
  }

  function getFieldError(name) {
    if (!touched.has(name)) return "";
    return computeFieldError(name, formData, t);
  }

  function handleSlotToggle(slot) {
    setFormData((current) => {
      const already = (current.preferredSlots || []).some((s) => s.startTime === slot.startTime);
      // Direct booking = single selection; toggling a selected slot deselects it
      const next = already
        ? []
        : [{ startTime: slot.startTime, endTime: slot.endTime, durationMinutes: slot.durationMinutes, label: slot.label }];
      return {
        ...current,
        preferredSlots: next,
        requestedDurationMinutes: String(slot.durationMinutes || current.requestedDurationMinutes || "")
      };
    });
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    setImageError("");
    setImageUploadRejected(false);
    if (!file) {
      setInspirationImage(null);
      return;
    }
    setImageProcessing(true);
    try {
      const preparedImage = await prepareLeadImageUpload(file);
      setInspirationImage(preparedImage);
    } catch (error) {
      setInspirationImage(null);
      // Rensa filväljaren så samma fil kan väljas igen efter ett fel.
      if (fileInputRef.current) fileInputRef.current.value = "";
      setImageError(error.message || t("leadForm.imageError"));
    } finally {
      setImageProcessing(false);
    }
  }

  function handleRemoveImage() {
    setInspirationImage(null);
    setImageError("");
    setImageUploadRejected(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function scrollToTop() {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleNext() {
    const stepId = steps[currentStep].id;
    if (stepId === "tattoo") {
      const fieldsToValidate = formData.bookingType === "consultation"
        ? ["description"]
        : STEP_TATTOO_FIELDS;
      const newTouched = new Set([...touched, ...fieldsToValidate]);
      setTouched(newTouched);
      if (fieldsToValidate.some((f) => computeFieldError(f, formData, t))) return;
    }
    if (stepId === "time") {
      // Under första hämtningen finns inga tider att välja. Utan spärren
      // klickade kunden sig förbi kalendern och landade på steg 3 utan tid.
      if (isCheckingAvailability) {
        setStatus({ state: "error", message: t("leadForm.checkingAvailability") });
        return;
      }
      if (requiresTimeSelection && (!formData.preferredSlots || formData.preferredSlots.length === 0)) {
        setStatus({ state: "error", message: t("leadForm.pickTimeFirst") });
        return;
      }
      setStatus({ state: "idle", message: "" });
    }
    setCurrentStep((s) => s + 1);
    scrollToTop();
  }

  function handleBack() {
    setStatus({ state: "idle", message: "" });
    setCurrentStep((s) => s - 1);
    scrollToTop();
  }

  async function submitLead(extraPayload = {}) {
    const selectedSlot = formData.preferredSlots?.[0] || null;
    const response = await createPublicStudioLead(studio.slug, {
      ...formData,
      bookingType: formData.bookingType || "tattoo_session",
      ...getLeadDetailFields(formData),
      // Språket kunden fyllde i formuläret på — CRM:et markerar leadet så att
      // studion vet att svara på engelska.
      language,
      privacyConsent: true,
      marketingConsent: false,
      draftId,
      preferredStartTime: selectedSlot?.startTime || "",
      preferredEndTime: selectedSlot?.endTime || "",
      requestedDurationMinutes: String(selectedSlot?.durationMinutes || formData.requestedDurationMinutes || ""),
      source: getLeadSourceFromUrl(),
      inspirationImage: inspirationImage
        ? {
            fileName: inspirationImage.fileName,
            contentType: inspirationImage.contentType,
            dataUrl: inspirationImage.dataUrl
          }
        : null,
      ...getTrackingPayload(),
      ...extraPayload
    });
    if (extraPayload.paymentIntentId) {
      setPaymentSuccess({
        amountSek: getChargedAmount(),
        studioName:
          studio?.publicProfile?.name || studio?.name || t("leadForm.paidFallbackStudio")
      });
    } else {
      setStatus({
        state: "success",
        message: response?.successMessage || t("leadForm.success")
      });
    }
    setFormData(buildInitialForm());
    setVisibleWeekIndex(0);
    setInspirationImage(null);
    setImageUploadRejected(false);
    setCurrentStep(0);
    setTouched(new Set());
    setPaymentReady(false);
    setPaymentIntentClientSecret(null);
    setPaymentIntentId(null);
    setChargedAmountSek(null);
    setPaidPaymentIntentId(null);
    clearDraft();
    if (fileInputRef.current) fileInputRef.current.value = "";
    scrollToTop();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // Betalningen är redan dragen. Vidare härifrån skulle gå in i
    // needsPayment-grenen nedan och skapa en ny PaymentIntent.
    if (paidPaymentIntentId) {
      await registerPaidLead(paidPaymentIntentId);
      return;
    }
    if (!hasAcceptedConsent) {
      setStatus({
        state: "error",
        message: t("leadForm.consentRequired")
      });
      openLegalModal();
      return;
    }
    if (!canSubmit) {
      setStatus({
        state: "error",
        message:
          studio?.previewDisabledMessage ||
          (hasStudioSlug ? t("leadForm.previewReadOnly") : t("leadForm.previewDisabled"))
      });
      return;
    }
    const newTouched = new Set([...touched, ...STEP_CONTACT_FIELDS]);
    setTouched(newTouched);
    if (STEP_CONTACT_FIELDS.some((f) => computeFieldError(f, formData, t))) return;

    // Om studion har Stripe Connect aktivt — skapa PaymentIntent och visa betalningsformulär
    if (needsPayment && !paymentReady) {
      setStatus({ state: "loading", message: t("leadForm.payPreparing") });
      try {
        const amountSek = getPaymentAmount();
        const pi = await createStudioPaymentIntent(studio.slug, {
          amountSek,
          // Servern läser samma typregel och vägrar skapa en depositionsintent
          // för en konsultation. Grinden här är förutsägelsen, den där är
          // spärren — vägen är publik och oautentiserad.
          bookingType: bookingTypeForPrepayment,
          // Den valda luckan. Servern kollar studions minsta framförhållning mot
          // den HÄR, innan pengarna dras. Kalendern hämtas inte om medan kunden
          // fyller i kontaktuppgifter, så den sista luckan före gränsen hann
          // annars passera den — och kunden fick manuell granskning i stället
          // för en bokning, med depositionen redan dragen.
          startTime: formData.preferredSlots?.[0]?.startTime || "",
          metadata: {
            leadName: formData.name,
            leadEmail: formData.email,
            studioSlug: studio.slug,
            // Leadet finns inte än — det skapas efter betalningen — så utkastet
            // är det enda som kan knyta ihop PaymentIntenten med CRM:et.
            // Backenden nycklar idempotensen på den, och webhooken hittar
            // tillbaka hit om kunden betalar och stänger fliken.
            ...(draftId ? { draftId } : {})
          }
        });
        setPaymentIntentClientSecret(pi.clientSecret);
        setPaymentIntentId(pi.paymentIntentId);
        setChargedAmountSek(typeof pi.amount === "number" ? pi.amount : null);
        setPaymentReady(true);
        setStatus({ state: "idle", message: "" });
      } catch (error) {
        setStatus({
          state: "error",
          message: error.message || t("leadForm.payStartFailed")
        });
      }
      return;
    }

    // Inget Stripe-krav — skicka lead direkt
    setStatus({ state: "loading", message: t("leadForm.sending") });
    try {
      await submitLead();
    } catch (error) {
      if (isInspirationImageError(error)) setImageUploadRejected(true);
      setStatus({
        state: "error",
        message: error.message || t("leadForm.sendFailed")
      });
    }
  }

  // Vägen texten lovar: "försök igen utan bild". Bilden väljs på steg 1, och
  // efter en betalning är Tillbaka-knappen dold — så det här är kundens enda
  // sätt att bli av med bilagan som servern inte kunde ta emot.
  const submitWithoutInspirationImage = useCallback(async () => {
    setInspirationImage(null);
    setImageUploadRejected(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStatus({
      state: "loading",
      message: paidPaymentIntentId ? t("leadForm.payRegistering") : t("leadForm.sending")
    });
    try {
      await submitLead({
        inspirationImage: null,
        ...(paidPaymentIntentId ? { paymentIntentId: paidPaymentIntentId } : {})
      });
    } catch (error) {
      setStatus({
        state: "error",
        message:
          error.message ||
          t(paidPaymentIntentId ? "leadForm.paySavedFailed" : "leadForm.sendFailed")
      });
    }
  }, [formData, draftId, paidPaymentIntentId, studio, t]);

  // Kallas av PaymentStep efter lyckad Stripe-betalning, och av kunden själv om
  // registreringen behöver göras om. Betalnings-id:t behålls vid fel — se
  // kommentaren vid paidPaymentIntentId.
  const registerPaidLead = useCallback(async (confirmedPaymentIntentId) => {
    if (!confirmedPaymentIntentId) return;
    setPaidPaymentIntentId(confirmedPaymentIntentId);
    setStatus({ state: "loading", message: t("leadForm.payRegistering") });
    try {
      await submitLead({ paymentIntentId: confirmedPaymentIntentId });
    } catch (error) {
      if (isInspirationImageError(error)) setImageUploadRejected(true);
      setStatus({
        state: "error",
        message: error.message || t("leadForm.paySavedFailed")
      });
    }
  }, [formData, draftId, inspirationImage, studio, t]);

  const stepId = steps[currentStep]?.id;
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  if (paymentSuccess) {
    return (
      <div className="payment-confirmed" ref={formTopRef}>
        <div className="payment-confirmed__icon">
          <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="26" cy="26" r="25" strokeWidth="2" />
            <path d="M14 27l8 8 16-16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="payment-confirmed__title">{t("leadForm.paidTitle")}</h2>
        <p className="payment-confirmed__amount">
          {t("leadForm.paidAmount", { amount: paymentSuccess.amountSek })}
        </p>
        <p className="payment-confirmed__message">
          {t("leadForm.paidMessageBefore")}
          <strong>{paymentSuccess.studioName}</strong>
          {t("leadForm.paidMessageAfter")}
        </p>
        <button
          type="button"
          className="payment-confirmed__btn"
          onClick={() => setPaymentSuccess(null)}
        >
          {t("leadForm.paidNewRequest")}
        </button>
      </div>
    );
  }

  return (
    <form
      className="booking-form studio-lead-form"
      onSubmit={handleSubmit}
      id="studio-form"
      ref={formTopRef}
    >
      {(() => {
        // Studions egna titel gäller bara på första steget; övriga steg får en
        // stegspecifik rubrik så att t.ex. kontaktsteget inte säger "din tatuering".
        const configuredTitle = titleText || studio?.publicProfile?.formTitle;
        const heading = currentStep === 0
          ? (configuredTitle || steps[currentStep]?.heading)
          : steps[currentStep]?.heading;
        return heading ? <h2>{heading}</h2> : null;
      })()}
      {introText ? <p className="form-note">{introText}</p> : null}
      {previewMode && successPreviewText ? (
        <div>
          <p className="form-note form-note--compact">{t("leadForm.successPreviewNote")}</p>
          <p className="form-status form-status--success" role="status" aria-live="polite">
            {successPreviewText}
          </p>
        </div>
      ) : null}

      {/* Kvittensen MÅSTE ligga på toppnivå. submitLead kör setCurrentStep(0)
          direkt efter setStatus, så kontaktsteget — där övriga statusmeddelanden
          bor — avmonteras i samma render. Låg den där blev formuläret bara tomt
          och kunden fick aldrig veta att förfrågan gick fram. */}
      {status.state === "success" && status.message ? (
        <p className="form-status form-status--success" role="status" aria-live="polite">
          {status.message}
        </p>
      ) : null}

      {/* Kampanjbannern ligger ovanför stegindikatorn, alltså synlig från första
          steget — det är kunder som INTE kände till kampanjen som ska se den.
          Filtreras på den bokningstyp kunden valt, så löftet stämmer med vad
          backenden faktiskt stämplar på förfrågan. */}
      {status.state !== "success" ? (
        <CampaignBanner campaigns={studio?.campaigns} bookingType={formData.bookingType} />
      ) : null}

      <div
        className="form-progress"
        aria-label={t("leadForm.progressAria", { current: currentStep + 1, total: steps.length })}
      >
        <div className="form-progress-bar">
          <div className="form-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="form-progress-label">
          <span>{t("leadForm.progressLabel", { current: currentStep + 1, total: steps.length })}</span>
          <span>{steps[currentStep].label}</span>
        </p>
      </div>

      <div className="hidden-trap" aria-hidden="true">
        <label htmlFor="lead-website">
          {t("leadForm.honeypot")}
          <input
            id="lead-website"
            type="text"
            name="website"
            tabIndex="-1"
            autoComplete="off"
            value={formData.website}
            onChange={handleChange}
          />
        </label>
      </div>

      {stepId === "tattoo" && (
        <div className="form-step">
          <div className="booking-type-selector">
            <button
              type="button"
              className={`booking-type-btn ${formData.bookingType === "tattoo_session" ? "booking-type-btn--active" : ""}`}
              onClick={() => { setStyleFellBackToConsultation(false); setFormData((c) => ({ ...c, bookingType: "tattoo_session" })); setTouched(new Set()); }}
            >
              {t("leadForm.typeTattoo")}
            </button>
            <button
              type="button"
              className={`booking-type-btn ${formData.bookingType === "consultation" ? "booking-type-btn--active" : ""}`}
              onClick={() => { setStyleFellBackToConsultation(false); setFormData((c) => ({ ...c, bookingType: "consultation" })); setTouched(new Set()); }}
            >
              {t("leadForm.typeConsultation")}
            </button>
          </div>

          {formData.bookingType === "consultation" && styleFellBackToConsultation && (
            <p className="booking-type-note" role="status">
              {t("leadForm.fallbackNote")}{" "}
              <button
                type="button"
                className="field-inline-action"
                onClick={() => {
                  setStyleFellBackToConsultation(false);
                  setFormData((current) => ({
                    ...current,
                    bookingType: "tattoo_session",
                    tattooStyle: ""
                  }));
                }}
              >
                {t("leadForm.fallbackBack")}
              </button>
            </p>
          )}

          {formData.bookingType === "tattoo_session" && (
          <div className="form-grid">
            <label
              htmlFor="lead-style"
              className={getFieldError("tattooStyle") ? "has-error" : ""}
            >
              {t("leadForm.styleLabel")} <span className="field-required">*</span>
              <CustomSelect
                id="lead-style"
                name="tattooStyle"
                value={formData.tattooStyle}
                onChange={handleStyleChange}
                onBlur={handleBlur}
                options={styleSelectOptions}
                placeholder={t("leadForm.stylePlaceholder")}
                ariaInvalid={!!getFieldError("tattooStyle")}
                nativeClassName="booking-form"
              />
              {getFieldError("tattooStyle") ? (
                <span className="field-error" role="alert">{getFieldError("tattooStyle")}</span>
              ) : null}
            </label>

            <label
              htmlFor="lead-placement"
              className={getFieldError("placement") ? "has-error" : ""}
            >
              {t("leadForm.placementLabel")} <span className="field-required">*</span>
              {placementSelectOptions.length && !showCustomPlacement ? (
                <CustomSelect
                  id="lead-placement"
                  name="placement"
                  value={formData.placement}
                  onChange={handlePlacementChange}
                  onBlur={handleBlur}
                  options={placementSelectOptions}
                  placeholder={t("leadForm.placementPlaceholder")}
                  ariaInvalid={!!getFieldError("placement")}
                  nativeClassName="booking-form"
                />
              ) : (
                <>
                  <input
                    id="lead-placement"
                    type="text"
                    name="placement"
                    placeholder={t("leadForm.placementFreeText")}
                    value={formData.placement}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!getFieldError("placement")}
                    autoFocus={showCustomPlacement}
                  />
                  {showCustomPlacement ? (
                    <button
                      type="button"
                      className="field-inline-action"
                      onClick={() => {
                        setShowCustomPlacement(false);
                        setFormData((current) => ({ ...current, placement: "" }));
                      }}
                    >
                      {t("leadForm.placementUseList")}
                    </button>
                  ) : null}
                </>
              )}
              {getFieldError("placement") ? (
                <span className="field-error" role="alert">{getFieldError("placement")}</span>
              ) : null}
            </label>

            <label htmlFor="lead-size" className={getFieldError("size") ? "has-error" : ""}>
              {t("leadForm.sizeLabel")} <span className="field-required">*</span>
              {(() => {
                const sizeOptions = buildSizeOptions(studio, t);
                if (sizeOptions) {
                  return (
                    <CustomSelect
                      id="lead-size"
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      options={sizeOptions}
                      placeholder={t("leadForm.sizePlaceholder")}
                      ariaInvalid={!!getFieldError("size")}
                      nativeClassName="booking-form"
                    />
                  );
                }
                return (
                  <input
                    id="lead-size"
                    type="text"
                    name="size"
                    placeholder={t("leadForm.sizeFreeText")}
                    value={formData.size}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!getFieldError("size")}
                  />
                );
              })()}
              {getFieldError("size") ? (
                <span className="field-error" role="alert">{getFieldError("size")}</span>
              ) : null}
            </label>

            <label htmlFor="lead-budget">
              {t("leadForm.budgetLabel")}
              <input
                id="lead-budget"
                type="text"
                name="budget"
                placeholder={t("leadForm.budgetPlaceholder")}
                value={formData.budget}
                onChange={handleChange}
              />
            </label>
          </div>
          )}

          <label
            htmlFor="lead-description"
            className={getFieldError("description") ? "has-error" : ""}
          >
            {formData.bookingType === "consultation"
              ? <>{t("leadForm.descriptionConsultation")} <span className="field-required">*</span></>
              : <>{t("leadForm.descriptionTattoo")} <span className="field-required">*</span></>}
            <textarea
              id="lead-description"
              name="description"
              rows="5"
              // Samma tak som backendens schema (publicSchemas.js). Utan det
              // kan en inklistrad text ge 400 från både booking-preview och
              // /leads, och preview-felet nollar kundens valda tid.
              maxLength={10000}
              placeholder={
                formData.bookingType === "consultation"
                  ? t("leadForm.descriptionPlaceholderConsultation")
                  : t("leadForm.descriptionPlaceholderTattoo")
              }
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!getFieldError("description")}
            />
            {getFieldError("description") ? (
              <span className="field-error" role="alert">{getFieldError("description")}</span>
            ) : null}
          </label>

          <div className="studio-lead-form__upload">
            <label htmlFor="lead-image">
              {t("leadForm.imageLabel")}
              <input
                ref={fileInputRef}
                id="lead-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                aria-invalid={!!imageError}
                aria-describedby="lead-image-hint"
              />
            </label>
            <p id="lead-image-hint" className="form-note form-note--compact">
              {t("leadForm.imageHint", { max: MAX_INSPIRATION_IMAGE_MB })}
            </p>
            {imageProcessing ? (
              <p className="form-status form-status--muted">{t("leadForm.imageProcessing")}</p>
            ) : null}
            {imageError ? (
              <p className="form-status form-status--error" role="alert">{imageError}</p>
            ) : null}
            {inspirationImage ? (
              <div className="upload-preview">
                <img src={inspirationImage.previewUrl} alt={t("leadForm.imagePreviewAlt")} />
                <div className="upload-preview__meta">
                  <span>{inspirationImage.fileName}</span>
                  <button className="btn btn-secondary" type="button" onClick={handleRemoveImage}>
                    {t("leadForm.imageRemove")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="form-step-nav">
            <button className="btn btn-primary" type="button" onClick={handleNext}>
              {t("common.next")}
            </button>
          </div>
        </div>
      )}

      {stepId === "time" && (
        <div className="form-step">
          {isCheckingAvailability ? (
            <p className="form-status form-status--muted">{t("leadForm.checkingAvailability")}</p>
          ) : null}
          {availability.state === "error" ? (
            <p className="form-status form-status--error">{availability.message}</p>
          ) : null}
          {/* Kontrollen misslyckades men vi har ett tidigare svar: kalendern
              nedan står kvar, men urvalet nollas (punkt 9). Beskrivningen
              påverkar estimatet, så en tid som hade rätt längd före ändringen
              kan ha fel längd efter den — kunden väljer om på ett klick.
              Granskning 4 punkt 2: luckorna är byggda på det gamla estimatet, så
              direktbokningen är avstängd här (requiresTimeSelection) och tiden
              går in som ett önskemål. Texten måste säga det. */}
          {timeStepNotice === "stale" ? (
            <p className="form-status form-status--muted">{availability.message}</p>
          ) : null}
          {/* Granskning 4 punkt 3: utan de här två grenarna renderades
              ingenting alls när kalendern var tom — rubriken och
              Tillbaka/Nästa stod kvar och kunden såg ett tomt steg mitt i
              formuläret. Båda tomma lägena är vanliga: en studio utan
              bokningsbara veckodagar, och ett fönster där allt redan är
              bokat. (Studior helt utan artister når inte hit längre — då är
              bookingFlow.enabled falskt och steget finns inte.) */}
          {timeStepNotice === "noSlots" ? (
            <p className="form-status form-status--muted">{t("leadForm.noSlots")}</p>
          ) : null}
          {timeStepNotice === "timesAreRequests" ? (
            <p className="form-status form-status--muted">{t("leadForm.timesAreRequests")}</p>
          ) : null}

          {(availability.state === "success" || availability.state === "stale") &&
          hasAvailableSlots ? (
            <section className="studio-booking-picker">
              {visibleWeek ? (
                <div className="week-picker">
                  <div className="week-picker__toolbar">
                    <button
                      className="week-picker__nav"
                      type="button"
                      onClick={() => setVisibleWeekIndex((i) => i - 1)}
                      disabled={visibleWeekIndex === 0}
                      aria-label={t("leadForm.prevWeek")}
                    >
                      ‹
                    </button>
                    <span className="week-picker__range">
                      {visibleWeek.days[0].monthLabel} – {visibleWeek.days[6].monthLabel}
                    </span>
                    <button
                      className="week-picker__nav"
                      type="button"
                      onClick={() => setVisibleWeekIndex((i) => i + 1)}
                      disabled={visibleWeekIndex >= weeks.length - 1}
                      aria-label={t("leadForm.nextWeek")}
                    >
                      ›
                    </button>
                  </div>
                  <div className="week-picker__grid">
                    {visibleWeek.days.map((day) => (
                      <div
                        key={day.key}
                        className={`week-picker__day ${!day.inRange || !day.isAvailable ? "week-picker__day--empty" : ""}`}
                      >
                        <div className="week-picker__day-header">
                          <span className="week-picker__weekday">{day.weekdayLabel}</span>
                          <span className="week-picker__date">{day.dayNumber}</span>
                        </div>
                        <div className="week-picker__slots">
                          {day.inRange && day.slots.length > 0 ? (
                            day.slots.map((slot) => {
                              const selected = (formData.preferredSlots || []).some((s) => s.startTime === slot.startTime);
                              return (
                                <button
                                  key={slot.startTime}
                                  type="button"
                                  className={`week-picker__slot ${selected ? "week-picker__slot--selected" : ""}`}
                                  onClick={() => handleSlotToggle(slot)}
                                >
                                  {slot.label}
                                </button>
                              );
                            })
                          ) : (
                            <span className="week-picker__no-slots">–</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {(formData.preferredSlots || []).length > 0 ? (
                <div className="studio-booking-picker__summary">
                  <div>
                    <strong>{t("leadForm.selectedTime")}</strong>
                    <span>
                      {(() => {
                        const s = formData.preferredSlots[0];
                        const d = new Date(s.startTime);
                        // Datumet MÅSTE läsas i studions zon. Klockslaget bredvid
                        // (`s.label`) kommer färdigskrivet från servern och är redan
                        // svensk tid — formaterades datumet i besökarens zon kunde
                        // raden bli "söndag 14 september kl. 09:00" om en tid som
                        // hos studion är måndag den 15:e.
                        const dateStr = d.toLocaleDateString(locale, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          timeZone: STUDIO_TIME_ZONE
                        });
                        return t("leadForm.selectedTimeValue", { date: dateStr, time: s.label });
                      })()}
                    </span>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}


          {status.state === "error" ? (
            <p className="form-status form-status--error" role="alert">
              {status.message}
            </p>
          ) : null}

          <div className="form-step-nav">
            <button className="btn btn-secondary" type="button" onClick={handleBack}>
              {t("common.back")}
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleNext}
              disabled={isCheckingAvailability}
            >
              {t("common.next")}
            </button>
          </div>
        </div>
      )}

      {stepId === "contact" && (
        <div className="form-step">
          <div className="form-grid">
            <label htmlFor="lead-name" className={getFieldError("name") ? "has-error" : ""}>
              {t("leadForm.nameLabel")} <span className="field-required">*</span>
              <input
                id="lead-name"
                type="text"
                name="name"
                placeholder={t("leadForm.namePlaceholder")}
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={!!getFieldError("name")}
              />
              {getFieldError("name") ? (
                <span className="field-error" role="alert">{getFieldError("name")}</span>
              ) : null}
            </label>

            <label htmlFor="lead-email" className={getFieldError("email") ? "has-error" : ""}>
              {t("leadForm.emailLabel")}
              <input
                id="lead-email"
                type="email"
                name="email"
                placeholder={t("leadForm.emailPlaceholder")}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!getFieldError("email")}
              />
              {getFieldError("email") ? (
                <span className="field-error" role="alert">{getFieldError("email")}</span>
              ) : null}
            </label>

            <label htmlFor="lead-phone">
              {t("leadForm.phoneLabel")}
              <input
                id="lead-phone"
                type="tel"
                name="phone"
                placeholder={t("leadForm.phonePlaceholder")}
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </label>
          </div>

          {prepaymentConfigured ? (
            // Punkt 12: rutan måste följa betalgrinden. Utan needsPayment står det
            // "betalas vid bokning" även när formuläret inte tar betalt alls.
            // Punkt 5: kunden debiteras ETT belopp av EN sort. Rutan renderar
            // därför den sort servern faktiskt räknat fram för den här
            // bokningstypen — aldrig båda styckena. Förr lästes flaggorna var
            // för sig, och en studio med båda påslagna visade "Deposition
            // 500 kr" OCH "Bokningsavgift 200 kr" men debiterade 500.
            <div className="form-payment-notice">
              {prepayment.kind === "deposit" ? (
                <p>
                  <strong>{t("leadForm.depositLabel")}</strong>{" "}
                  {t(needsPayment ? "leadForm.depositText" : "leadForm.depositLaterText", {
                    amount: prepayment.amountSek
                  })}
                </p>
              ) : null}
              {prepayment.kind === "booking_fee" ? (
                <p>
                  <strong>{t("leadForm.feeLabel")}</strong>{" "}
                  {t(needsPayment ? "leadForm.feeText" : "leadForm.feeLaterText", {
                    amount: prepayment.amountSek
                  })}
                </p>
              ) : null}
              {needsPayment ? (
                <p className="form-payment-notice-stripe">{t("leadForm.stripeNote")}</p>
              ) : null}
            </div>
          ) : null}

          {paidPaymentIntentId ? (
            <div className="form-payment-retry">
              <p className="form-payment-retry-text" role="status">
                {t("leadForm.payRegisterRetryInfo")}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => registerPaidLead(paidPaymentIntentId)}
                disabled={status.state === "loading"}
              >
                {status.state === "loading"
                  ? t("leadForm.payRegistering")
                  : t("leadForm.payRegisterRetry")}
              </button>
            </div>
          ) : null}

          {!paidPaymentIntentId && paymentReady && stripePromise && paymentIntentClientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: paymentIntentClientSecret,
                appearance: { theme: "night", variables: { colorPrimary: "#e07b3c" } }
              }}
            >
              <PaymentStep
                amountSek={getChargedAmount()}
                paymentIntentId={paymentIntentId}
                onConfirmed={registerPaidLead}
                onCancel={() => { setPaymentReady(false); setPaymentIntentClientSecret(null); setPaymentIntentId(null); setChargedAmountSek(null); setStatus({ state: "idle", message: "" }); }}
                submitting={status.state === "loading"}
              />
            </Elements>
          ) : null}

          <FormLegalLinks />

          {!canSubmit ? (
            <p className="form-status form-status--muted">
              {hasStudioSlug ? t("leadForm.previewReadOnly") : t("leadForm.previewNotice")}
            </p>
          ) : null}

          {status.message && status.state !== "success" ? (
            <p
              className="form-status form-status--error"
              role="status"
              aria-live="polite"
            >
              {status.message}
            </p>
          ) : null}

          {imageUploadRejected ? (
            <div className="form-payment-retry">
              <p className="form-payment-retry-text" role="status">
                {t("leadForm.imageUploadFailedInfo")}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={submitWithoutInspirationImage}
                disabled={status.state === "loading"}
              >
                {status.state === "loading"
                  ? t("leadForm.submitting")
                  : t("leadForm.submitWithoutImage")}
              </button>
            </div>
          ) : null}

          {!paymentReady && !paidPaymentIntentId ? (
            <div className="form-step-nav">
              <button className="btn btn-secondary" type="button" onClick={handleBack}>
                {t("common.back")}
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={status.state === "loading" || imageProcessing || !canSubmit}
              >
                {status.state === "loading"
                  ? needsPayment
                    ? t("leadForm.payPreparing")
                    : t("leadForm.submitting")
                  : needsPayment
                    ? t("leadForm.payToPayment", { amount: getPaymentAmount() })
                    : t("leadForm.submit")}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </form>
  );
}
