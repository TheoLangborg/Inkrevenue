import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { FormLegalLinks } from "./FormLegalLinks";
import { useLegalConsent } from "../contexts/LegalConsentContext";
import {
  createPublicStudioLead,
  createStudioPaymentIntent,
  previewPublicStudioBooking
} from "../services/publicSiteApi";
import { useAbandonedFormDraft } from "../hooks/useAbandonedFormDraft";
import { getLeadSourceFromUrl, getTrackingPayload } from "../utils/tracking";
import { prepareLeadImageUpload } from "../utils/prepareLeadImageUpload";

const WEEKDAY_LABELS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

const baseForm = {
  name: "",
  email: "",
  phone: "",
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

function getMonthLabel(date) {
  const label = date.toLocaleDateString("sv-SE", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getCalendarGridStart(date) {
  const gridStart = new Date(date);
  const weekday = (gridStart.getDay() + 6) % 7;
  gridStart.setDate(gridStart.getDate() - weekday);
  return gridStart;
}

function getCalendarGridEnd(date) {
  const gridEnd = new Date(date);
  const weekday = (gridEnd.getDay() + 6) % 7;
  gridEnd.setDate(gridEnd.getDate() + (6 - weekday));
  return gridEnd;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeeks(availabilityData) {
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
        weekdayLabel: WEEKDAY_LABELS[i],
        monthLabel: d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" }),
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

function getCalendarDayText(day) {
  if (!day.inCurrentMonth || !day.inLoadedRange) return "";
  if (day.isAvailable) return day.slotCount === 1 ? "1 tid" : `${day.slotCount} tider`;
  return "Upptagen";
}

function formatDurationLabel(minutes) {
  const normalizedMinutes = Number.parseInt(String(minutes || ""), 10);
  if (!normalizedMinutes) return "";
  const hours = Math.floor(normalizedMinutes / 60);
  const remainingMinutes = normalizedMinutes % 60;
  if (hours && remainingMinutes) return `${hours} h ${remainingMinutes} min`;
  if (hours) return `${hours} h`;
  return `${remainingMinutes} min`;
}

function getBookingTypeLabel(type) {
  const labels = {
    consultation: "Konsultation",
    tattoo_session: "Tatueringspass",
    touch_up: "Touch-up"
  };
  return labels[type] || type || "";
}

function buildCalendarMonths(availabilityData) {
  const startDate = parseDateKey(availabilityData?.startDate);
  if (!startDate) return [];
  const availableDates = new Map(
    (availabilityData?.dates || []).map((dateEntry) => [dateEntry.date, dateEntry])
  );
  const daysToShow = Math.max(1, Number.parseInt(String(availabilityData?.days || ""), 10) || 1);
  const endDate = addDays(startDate, daysToShow - 1);
  const lastMonthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const months = [];
  for (
    let monthCursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    monthCursor.getTime() <= lastMonthStart.getTime();
    monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)
  ) {
    const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
    const gridStart = getCalendarGridStart(monthStart);
    const gridEnd = getCalendarGridEnd(monthEnd);
    const days = [];
    for (
      let cursor = new Date(gridStart);
      cursor.getTime() <= gridEnd.getTime();
      cursor = addDays(cursor, 1)
    ) {
      const dateKey = formatDateKey(cursor);
      const dateEntry = availableDates.get(dateKey) || null;
      const inLoadedRange =
        cursor.getTime() >= startDate.getTime() && cursor.getTime() <= endDate.getTime();
      const inCurrentMonth = cursor.getMonth() === monthStart.getMonth();
      const slotCount = dateEntry?.slots?.length || 0;
      days.push({
        key: dateKey,
        date: dateKey,
        dayNumber: cursor.getDate(),
        label:
          dateEntry?.label ||
          cursor.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" }),
        inCurrentMonth,
        inLoadedRange,
        isAvailable: slotCount > 0,
        isSelectable: inLoadedRange && inCurrentMonth && slotCount > 0,
        slotCount
      });
    }
    months.push({
      key: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`,
      label: getMonthLabel(monthStart),
      availableDayCount: days.filter((day) => day.isSelectable).length,
      days
    });
  }
  return months;
}

function buildSizeOptions(studio) {
  const thresholds = studio?.bookingFlow?.estimatorSummary?.sizeThresholds;
  if (!thresholds) return null;

  const { tinyMaxCentimeters, smallMaxCentimeters, mediumMaxCentimeters, largeMaxCentimeters } = thresholds;

  const options = [];

  if (tinyMaxCentimeters > 0) {
    options.push({ value: `${tinyMaxCentimeters}cm`, label: `Mycket liten (upp till ${tinyMaxCentimeters} cm)` });
  }
  if (smallMaxCentimeters > 0 && smallMaxCentimeters > tinyMaxCentimeters) {
    options.push({ value: `${smallMaxCentimeters}cm`, label: `Liten (upp till ${smallMaxCentimeters} cm)` });
  }
  if (mediumMaxCentimeters > 0 && mediumMaxCentimeters > smallMaxCentimeters) {
    options.push({ value: `${mediumMaxCentimeters}cm`, label: `Mellanstor (upp till ${mediumMaxCentimeters} cm)` });
  }
  if (largeMaxCentimeters > 0 && largeMaxCentimeters > mediumMaxCentimeters) {
    options.push({ value: `${largeMaxCentimeters}cm`, label: `Stor (upp till ${largeMaxCentimeters} cm)` });
  }
  options.push({ value: "extra_large", label: "Extra stor / helarm / rygg" });

  return options.length >= 2 ? options : null;
}

function hasEnoughDetailsForCalendar(formData) {
  return Boolean(
    String(formData.tattooStyle || "").trim() &&
      String(formData.placement || "").trim() &&
      String(formData.size || "").trim() &&
      String(formData.description || "").trim()
  );
}

function clearRequestedTimeSelection(currentFormData, requestedDurationMinutes = "") {
  return {
    ...currentFormData,
    preferredSlots: [],
    requestedDurationMinutes: String(requestedDurationMinutes || "")
  };
}

function computeFieldError(name, formData) {
  switch (name) {
    case "tattooStyle":
      return !formData.tattooStyle.trim() ? "Fyll i tatueringsstil." : "";
    case "placement":
      return !formData.placement.trim() ? "Fyll i placering." : "";
    case "size":
      return !formData.size.trim() ? "Fyll i storlek." : "";
    case "description":
      return !formData.description.trim() ? "Beskriv motiv och önskemål." : "";
    case "name":
      return formData.name.trim().length < 2 ? "Fyll i ditt namn." : "";
    case "email":
      if (!formData.email.trim() && !formData.phone.trim()) {
        return "Ange minst din e-post eller ditt telefonnummer.";
      }
      if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        return "Ange en giltig e-postadress.";
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
  const stripe = useStripe();
  const elements = useElements();
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState(false);

  async function handlePay() {
    if (!stripe || !elements || paying || submitting) return;
    setPaying(true);
    setPayError("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required"
    });

    if (error) {
      setPayError(error.message || "Betalningen misslyckades. Försök igen.");
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      await onConfirmed(paymentIntent.id);
    } else {
      setPayError("Betalningen bekräftades inte. Kontakta studion om beloppet dragits.");
      setPaying(false);
    }
  }

  return (
    <div className="form-payment-step">
      <div className="form-payment-step-header">
        <strong>Betala {amountSek} kr</strong>
        <span>Säker betalning via Stripe</span>
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
          Tillbaka
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePay}
          disabled={!stripe || paying || submitting}
        >
          {paying || submitting ? "Bearbetar..." : `Betala ${amountSek} kr`}
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
  previewMode = false
}) {
  const [formData, setFormData] = useState(() => buildInitialForm());
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [availability, setAvailability] = useState(() => createAvailabilityState());
  const [visibleWeekIndex, setVisibleWeekIndex] = useState(0);
  const [inspirationImage, setInspirationImage] = useState(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [touched, setTouched] = useState(new Set());

  // Stripe Connect state
  const [stripePromise, setStripePromise] = useState(null);
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [paymentReady, setPaymentReady] = useState(false); // true after PaymentIntent created
  const [paymentSuccess, setPaymentSuccess] = useState(null); // { amountSek, studioName } after confirmed payment

  const canSubmit = Boolean(studio?.slug);
  const { hasAcceptedConsent, openLegalModal } = useLegalConsent();
  const fileInputRef = useRef(null);
  const previewRequestIdRef = useRef(0);
  const formTopRef = useRef(null);
  const bookingFlow = studio?.bookingFlow;
  const canShowCalendar = Boolean(canSubmit && bookingFlow?.enabled);

  const steps = useMemo(() => {
    return [
      { id: "tattoo", label: "Om tatueringen" },
      ...(canShowCalendar ? [{ id: "time", label: "Välj tid" }] : []),
      { id: "contact", label: "Dina uppgifter" }
    ];
  }, [canShowCalendar]);

  // Ladda Stripe.js om studion har ett aktivt Connect-konto
  useEffect(() => {
    const pk = studio?.payment?.stripePublishableKey;
    const accountId = studio?.payment?.stripeConnectAccountId;
    if (pk && accountId && !stripePromise) {
      setStripePromise(loadStripe(pk, { stripeAccount: accountId }));
    }
  }, [studio?.payment?.stripePublishableKey, studio?.payment?.stripeConnectAccountId]);

  const needsPayment = Boolean(
    studio?.payment?.stripeConnectReady &&
    (studio?.payment?.depositRequired || studio?.payment?.bookingFeeEnabled)
  );

  function getPaymentAmount() {
    if (!studio?.payment) return 0;
    if (studio.payment.depositRequired) return studio.payment.depositAmountSek;
    if (studio.payment.bookingFeeEnabled) return studio.payment.bookingFeeAmountSek;
    return 0;
  }

  const hasEnoughDetails = useMemo(() => hasEnoughDetailsForCalendar(formData), [formData]);
  const draftPayload = useMemo(
    () => ({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      tattooStyle: formData.tattooStyle,
      placement: formData.placement,
      size: formData.size,
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
  const weeks = useMemo(
    () => buildWeeks(availability.data),
    [availability.data]
  );
  const visibleWeek = useMemo(
    () => weeks[visibleWeekIndex] || null,
    [weeks, visibleWeekIndex]
  );
  const requiresTimeSelection = Boolean(
    canShowCalendar &&
      hasEnoughDetails &&
      availability.state === "success" &&
      availability.data?.eligibleForDirectBooking &&
      weeks.some((w) => w.days.some((d) => d.slots.length > 0))
  );

  useEffect(() => {
    previewRequestIdRef.current += 1;
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
      setAvailability(createAvailabilityState());
      setVisibleWeekIndex(0);
      return;
    }
    if (!hasEnoughDetails) {
      setAvailability(createAvailabilityState());
      setVisibleWeekIndex(0);
      setFormData((current) => clearRequestedTimeSelection(current));
      return;
    }
    let active = true;
    const timeoutId = setTimeout(() => {
      setAvailability(
        createAvailabilityState({ state: "loading", message: "Kontrollerar lediga tider..." })
      );
      previewPublicStudioBooking(studio.slug, {
        tattooStyle: formData.tattooStyle,
        placement: formData.placement,
        size: formData.size,
        budget: formData.budget,
        description: formData.description
      })
        .then((response) => {
          if (!active) return;
          setAvailability(createAvailabilityState({ state: "success", data: response }));
          setVisibleWeekIndex(0);
          setFormData((current) => {
            const allSlotTimes = new Set(
              (response?.dates || []).flatMap((d) => d.slots?.map((s) => s.startTime) || [])
            );
            const stillValid = (current.preferredSlots || []).filter((s) => allSlotTimes.has(s.startTime));
            return {
              ...current,
              preferredSlots: stillValid,
              requestedDurationMinutes: String(response?.suggestedDurationMinutes || current.requestedDurationMinutes || "")
            };
          });
        })
        .catch((error) => {
          if (!active) return;
          setAvailability(
            createAvailabilityState({
              state: "error",
              message: error.message || "Det gick inte att kontrollera lediga tider just nu."
            })
          );
          setFormData((current) => ({
            ...current,
            preferredSlots: [],
            requestedDurationMinutes: ""
          }));
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [
    canShowCalendar,
    hasEnoughDetails,
    studio?.slug,
    formData.tattooStyle,
    formData.placement,
    formData.size,
    formData.budget,
    formData.description
  ]);


  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function handleBlur(event) {
    const { name } = event.target;
    setTouched((prev) => new Set([...prev, name]));
  }

  function getFieldError(name) {
    if (!touched.has(name)) return "";
    return computeFieldError(name, formData);
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
      setStatus({
        state: "error",
        message: error.message || "Det gick inte att förbereda bilden för uppladdning."
      });
    } finally {
      setImageProcessing(false);
    }
  }

  function handleRemoveImage() {
    setInspirationImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function scrollToTop() {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleNext() {
    const stepId = steps[currentStep].id;
    if (stepId === "tattoo") {
      const newTouched = new Set([...touched, ...STEP_TATTOO_FIELDS]);
      setTouched(newTouched);
      if (STEP_TATTOO_FIELDS.some((f) => computeFieldError(f, formData))) return;
    }
    if (stepId === "time") {
      if (requiresTimeSelection && (!formData.preferredSlots || formData.preferredSlots.length === 0)) {
        setStatus({ state: "error", message: "Välj minst en ledig tid innan du fortsätter." });
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
        amountSek: getPaymentAmount(),
        studioName: studio?.publicProfile?.name || studio?.name || "studion"
      });
    } else {
      setStatus({
        state: "success",
        message:
          response?.successMessage ||
          "Tack! Din förfrågan är skickad. Studion återkopplar normalt inom 24 timmar via e-post eller telefon."
      });
    }
    setFormData(buildInitialForm());
    setVisibleWeekIndex(0);
    setInspirationImage(null);
    setCurrentStep(0);
    setTouched(new Set());
    setPaymentReady(false);
    setPaymentIntentClientSecret(null);
    setPaymentIntentId(null);
    clearDraft();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!hasAcceptedConsent) {
      setStatus({
        state: "error",
        message: "Godkänn integritetspolicy och villkor för att fortsätta."
      });
      openLegalModal();
      return;
    }
    if (!canSubmit) {
      setStatus({
        state: "error",
        message:
          studio?.previewDisabledMessage ||
          "Den här demosidan är inte kopplad till en riktig studio i CRM ännu."
      });
      return;
    }
    const newTouched = new Set([...touched, ...STEP_CONTACT_FIELDS]);
    setTouched(newTouched);
    if (STEP_CONTACT_FIELDS.some((f) => computeFieldError(f, formData))) return;

    // Om studion har Stripe Connect aktivt — skapa PaymentIntent och visa betalningsformulär
    if (needsPayment && !paymentReady) {
      setStatus({ state: "loading", message: "Förbereder betalning..." });
      try {
        const amountSek = getPaymentAmount();
        const pi = await createStudioPaymentIntent(studio.slug, {
          amountSek,
          metadata: {
            leadName: formData.name,
            leadEmail: formData.email,
            studioSlug: studio.slug
          }
        });
        setPaymentIntentClientSecret(pi.clientSecret);
        setPaymentIntentId(pi.paymentIntentId);
        setPaymentReady(true);
        setStatus({ state: "idle", message: "" });
      } catch (error) {
        setStatus({
          state: "error",
          message: error.message || "Kunde inte starta betalningen. Försök igen."
        });
      }
      return;
    }

    // Inget Stripe-krav — skicka lead direkt
    setStatus({ state: "loading", message: "Skickar din förfrågan..." });
    try {
      await submitLead();
    } catch (error) {
      setStatus({
        state: "error",
        message: error.message || "Det gick inte att skicka just nu. Försök igen lite senare."
      });
    }
  }

  // Kallas av PaymentStep efter lyckad Stripe-betalning
  const handlePaymentConfirmed = useCallback(async (confirmedPaymentIntentId) => {
    setStatus({ state: "loading", message: "Registrerar din bokning..." });
    try {
      await submitLead({ paymentIntentId: confirmedPaymentIntentId });
    } catch (error) {
      setStatus({
        state: "error",
        message: error.message || "Betalningen gick igenom men bokningen kunde inte sparas. Kontakta studion."
      });
    }
  }, [formData, draftId, inspirationImage, studio]);

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
        <h2 className="payment-confirmed__title">Betalning genomförd</h2>
        <p className="payment-confirmed__amount">{paymentSuccess.amountSek} kr</p>
        <p className="payment-confirmed__message">
          Din förfrågan är skickad till <strong>{paymentSuccess.studioName}</strong> och depositionsavgiften är betald.
          Du får en bekräftelse via e-post inom kort.
        </p>
        <button
          type="button"
          className="payment-confirmed__btn"
          onClick={() => setPaymentSuccess(null)}
        >
          Skicka ny förfrågan
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
      {titleText || studio?.publicProfile?.formTitle ? (
        <h2>{titleText || studio?.publicProfile?.formTitle}</h2>
      ) : null}
      {introText ? <p className="form-note">{introText}</p> : null}
      {previewMode && successPreviewText ? (
        <div>
          <p className="form-note form-note--compact">
            Förhandsvisning av tackmeddelandet som visas efter skickad förfrågan
          </p>
          <p className="form-status form-status--success" role="status" aria-live="polite">
            {successPreviewText}
          </p>
        </div>
      ) : null}

      <div className="form-progress" aria-label={`Steg ${currentStep + 1} av ${steps.length}`}>
        <div className="form-progress-bar">
          <div className="form-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="form-progress-label">
          <span>Steg {currentStep + 1} av {steps.length}</span>
          <span>{steps[currentStep].label}</span>
        </p>
      </div>

      <div className="hidden-trap" aria-hidden="true">
        <label htmlFor="lead-website">
          Lämna detta fält tomt
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
          <div className="form-grid">
            <label
              htmlFor="lead-style"
              className={getFieldError("tattooStyle") ? "has-error" : ""}
            >
              Stil <span className="field-required">*</span>
              <input
                id="lead-style"
                type="text"
                name="tattooStyle"
                placeholder="Fineline, realism, blackwork..."
                value={formData.tattooStyle}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!getFieldError("tattooStyle")}
              />
              {getFieldError("tattooStyle") ? (
                <span className="field-error" role="alert">{getFieldError("tattooStyle")}</span>
              ) : null}
            </label>

            <label
              htmlFor="lead-placement"
              className={getFieldError("placement") ? "has-error" : ""}
            >
              Placering <span className="field-required">*</span>
              <input
                id="lead-placement"
                type="text"
                name="placement"
                placeholder="Arm, rygg, ben..."
                value={formData.placement}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!getFieldError("placement")}
              />
              {getFieldError("placement") ? (
                <span className="field-error" role="alert">{getFieldError("placement")}</span>
              ) : null}
            </label>

            <label htmlFor="lead-size" className={getFieldError("size") ? "has-error" : ""}>
              Storlek <span className="field-required">*</span>
              {(() => {
                const sizeOptions = buildSizeOptions(studio);
                if (sizeOptions) {
                  return (
                    <select
                      id="lead-size"
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={!!getFieldError("size")}
                    >
                      <option value="">Välj storlek...</option>
                      {sizeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  );
                }
                return (
                  <input
                    id="lead-size"
                    type="text"
                    name="size"
                    placeholder="Liten, medium eller i cm"
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
              Budget
              <input
                id="lead-budget"
                type="text"
                name="budget"
                placeholder="T.ex. 3000-5000 kr"
                value={formData.budget}
                onChange={handleChange}
              />
            </label>
          </div>

          <label
            htmlFor="lead-description"
            className={getFieldError("description") ? "has-error" : ""}
          >
            Berätta om din tatuering <span className="field-required">*</span>
            <textarea
              id="lead-description"
              name="description"
              rows="5"
              placeholder="Beskriv motiv, känsla, referenser och allt som är viktigt för studion att veta."
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
              Inspirationsbild
              <input
                ref={fileInputRef}
                id="lead-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
            </label>
            <p className="form-note form-note--compact">
              Valfritt. Ladda upp en bild om du vill visa stil, motiv eller referens tydligare.
            </p>
            {imageProcessing ? (
              <p className="form-status form-status--muted">Bearbetar bilden...</p>
            ) : null}
            {inspirationImage ? (
              <div className="upload-preview">
                <img src={inspirationImage.previewUrl} alt="Förhandsvisning av inspirationsbild" />
                <div className="upload-preview__meta">
                  <span>{inspirationImage.fileName}</span>
                  <button className="btn btn-secondary" type="button" onClick={handleRemoveImage}>
                    Ta bort bild
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="form-step-nav">
            <button className="btn btn-primary" type="button" onClick={handleNext}>
              Nästa steg
            </button>
          </div>
        </div>
      )}

      {stepId === "time" && (
        <div className="form-step">
          {isCheckingAvailability ? (
            <p className="form-status form-status--muted">Kontrollerar lediga tider...</p>
          ) : null}
          {availability.state === "error" ? (
            <p className="form-status form-status--error">{availability.message}</p>
          ) : null}

          {availability.state === "success" && weeks.some((w) => w.days.some((d) => d.slots.length > 0)) ? (
            <section className="studio-booking-picker">
              {availability.data?.estimatedTotalDurationMinutes ? (
                <p className="week-picker__estimate">
                  Uppskattad tid: <strong>{formatDurationLabel(availability.data.estimatedTotalDurationMinutes)}</strong>
                  {availability.data?.artistName ? ` · ${availability.data.artistName}` : ""}
                </p>
              ) : null}
              {visibleWeek ? (
                <div className="week-picker">
                  <div className="week-picker__toolbar">
                    <button
                      className="week-picker__nav"
                      type="button"
                      onClick={() => setVisibleWeekIndex((i) => i - 1)}
                      disabled={visibleWeekIndex === 0}
                      aria-label="Föregående vecka"
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
                      aria-label="Nästa vecka"
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
                    <strong>Vald tid</strong>
                    <span>
                      {(() => {
                        const s = formData.preferredSlots[0];
                        const d = new Date(s.startTime);
                        const dateStr = d.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
                        return `${dateStr} kl. ${s.label}`;
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
              Tillbaka
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleNext}
              disabled={isCheckingAvailability}
            >
              Nästa steg
            </button>
          </div>
        </div>
      )}

      {stepId === "contact" && (
        <div className="form-step">
          <div className="form-grid">
            <label htmlFor="lead-name" className={getFieldError("name") ? "has-error" : ""}>
              Namn <span className="field-required">*</span>
              <input
                id="lead-name"
                type="text"
                name="name"
                placeholder="Ditt namn"
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
              E-post
              <input
                id="lead-email"
                type="email"
                name="email"
                placeholder="namn@mail.online"
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
              Telefonnummer
              <input
                id="lead-phone"
                type="tel"
                name="phone"
                placeholder="070-000 00 00"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </label>
          </div>

          {studio?.payment?.depositRequired || studio?.payment?.bookingFeeEnabled ? (
            <div className="form-payment-notice">
              {studio.payment.depositRequired ? (
                <p>
                  <strong>Deposition krävs:</strong> {studio.payment.depositAmountSek} kr betalas
                  vid bokning och räknas av mot slutpriset.
                </p>
              ) : null}
              {studio.payment.bookingFeeEnabled ? (
                <p>
                  <strong>Bokningsavgift:</strong> {studio.payment.bookingFeeAmountSek} kr är en
                  administrativ avgift som betalas vid bokning och räknas inte av mot slutpriset.
                </p>
              ) : null}
              {studio.payment.stripeConnectReady ? (
                <p className="form-payment-notice-stripe">
                  Betalning sker säkert via Stripe direkt till studion.
                </p>
              ) : null}
            </div>
          ) : null}

          {paymentReady && stripePromise && paymentIntentClientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: paymentIntentClientSecret,
                appearance: { theme: "night", variables: { colorPrimary: "#e07b3c" } }
              }}
            >
              <PaymentStep
                amountSek={getPaymentAmount()}
                paymentIntentId={paymentIntentId}
                onConfirmed={handlePaymentConfirmed}
                onCancel={() => { setPaymentReady(false); setPaymentIntentClientSecret(null); setPaymentIntentId(null); setStatus({ state: "idle", message: "" }); }}
                submitting={status.state === "loading"}
              />
            </Elements>
          ) : null}

          <FormLegalLinks />

          {!canSubmit ? (
            <p className="form-status form-status--muted">
              Preview-läge: koppla sidan till en CRM-slug för att testa att skicka riktiga leads.
            </p>
          ) : null}

          {status.message ? (
            <p
              className={`form-status ${
                status.state === "success" ? "form-status--success" : "form-status--error"
              }`}
              role="status"
              aria-live="polite"
            >
              {status.message}
            </p>
          ) : null}

          {!paymentReady ? (
            <div className="form-step-nav">
              <button className="btn btn-secondary" type="button" onClick={handleBack}>
                Tillbaka
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={status.state === "loading" || imageProcessing || !canSubmit}
              >
                {status.state === "loading"
                  ? needsPayment ? "Förbereder betalning..." : "Skickar..."
                  : needsPayment
                    ? `Gå till betalning — ${getPaymentAmount()} kr`
                    : "Skicka förfrågan"}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </form>
  );
}
