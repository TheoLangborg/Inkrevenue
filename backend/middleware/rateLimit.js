import { resolveClientAddress } from "../utils/clientAddress.js";

const submissionState = new Map();
const draftSaveState = new Map();
const publicReadState = new Map();
const visitTrackingState = new Map();
const bookingPreviewState = new Map();

const submissionWindowMs = Number(process.env.SUBMISSION_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const submissionMaxRequests = Number(process.env.SUBMISSION_RATE_LIMIT_MAX || 6);
const draftSaveWindowMs = Number(process.env.DRAFT_SAVE_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const draftSaveMaxRequests = Number(process.env.DRAFT_SAVE_RATE_LIMIT_MAX || 40);
const publicReadWindowMs = Number(process.env.PUBLIC_READ_RATE_LIMIT_WINDOW_MS || 60 * 1000);
const publicReadMaxRequests = Number(process.env.PUBLIC_READ_RATE_LIMIT_MAX || 20);
const visitTrackingWindowMs = Number(process.env.VISIT_TRACKING_RATE_LIMIT_WINDOW_MS || 60 * 1000);
const visitTrackingMaxRequests = Number(process.env.VISIT_TRACKING_RATE_LIMIT_MAX || 60);
const bookingPreviewWindowMs = Number(
  process.env.BOOKING_PREVIEW_RATE_LIMIT_WINDOW_MS || 60 * 1000
);
const bookingPreviewMaxRequests = Number(process.env.BOOKING_PREVIEW_RATE_LIMIT_MAX || 40);

function enforceRateLimit(request, scope, { state, windowMs, maxRequests, message }) {
  const key = `${scope}:${resolveClientAddress(request)}`;
  const now = Date.now();
  const activeAttempts = (state.get(key) || []).filter((ts) => now - ts < windowMs);

  if (activeAttempts.length >= maxRequests) {
    return { limited: true, message };
  }

  activeAttempts.push(now);
  state.set(key, activeAttempts);

  return { limited: false };
}

export function enforceSubmissionRateLimit(request, scope) {
  return enforceRateLimit(request, scope, {
    state: submissionState,
    windowMs: submissionWindowMs,
    maxRequests: submissionMaxRequests,
    message:
      "Vi har tagit emot många försök från samma anslutning på kort tid. Vänta en stund och försök igen."
  });
}

export function enforcePublicReadRateLimit(request, scope) {
  return enforceRateLimit(request, scope, {
    state: publicReadState,
    windowMs: publicReadWindowMs,
    maxRequests: publicReadMaxRequests,
    message:
      "Vi har tagit emot många förfrågningar från samma anslutning. Vänta en kort stund och försök igen."
  });
}

/**
 * Bokningsförhandsvisningen: eget tak, inte publicReadRateLimit.
 *
 * Formuläret anropar vägen 300 ms efter varje paus i beskrivningsfältet
 * (StudioLeadFormEnhanced.jsx), så en kund som skriver eftertänksamt gör
 * tiotals anrop på en minut — helt legitimt. På 20/min slog det i taket, och
 * 429:an landade i formulärets .catch som nollade kundens valda tid. Delad hink
 * med sidladdningen och studiolistan gjorde det värre. Samma tak som
 * CRM-backendens bookingPreviewLimiter.
 */
export function enforceBookingPreviewRateLimit(request, scope) {
  return enforceRateLimit(request, scope, {
    state: bookingPreviewState,
    windowMs: bookingPreviewWindowMs,
    maxRequests: bookingPreviewMaxRequests,
    message:
      "Vi har tagit emot många förfrågningar från samma anslutning. Vänta en kort stund och försök igen."
  });
}

/**
 * Besöksmätning: generösare än publicReadRateLimit med flit. Mobiloperatörer
 * NAT:ar många besökare bakom samma IP, och ett tappat besök syns direkt som ett
 * hål i statistiken. Samma tak som CRM-backendens visitTrackingLimiter.
 */
export function enforceVisitTrackingRateLimit(request, scope) {
  return enforceRateLimit(request, scope, {
    state: visitTrackingState,
    windowMs: visitTrackingWindowMs,
    maxRequests: visitTrackingMaxRequests,
    message: "För många besöksregistreringar från samma anslutning."
  });
}

export function enforceDraftSaveRateLimit(request, scope) {
  return enforceRateLimit(request, scope, {
    state: draftSaveState,
    windowMs: draftSaveWindowMs,
    maxRequests: draftSaveMaxRequests,
    message:
      "Vi har tagit emot många sparningar från samma anslutning på kort tid. Vänta en stund och försök igen."
  });
}

const tryOnImageState = new Map();
const tryOnImageMaxRequests = Number(process.env.TRY_ON_IMAGE_RATE_LIMIT_MAX || 150);

/**
 * Bilderna till studions motiv i provningen på kroppen. Kundvyn hämtar alla
 * miniatyrer på en gång, långt över publicReadRateLimits 20/min. Samma tak som
 * CRM-backendens tryOnImageLimiter (routes/tryOnMotifsRoutes.js).
 */
export function enforceTryOnImageRateLimit(request, scope) {
  return enforceRateLimit(request, scope, {
    state: tryOnImageState,
    windowMs: 60 * 1000,
    maxRequests: tryOnImageMaxRequests,
    message: "För många bilder från samma anslutning. Vänta en kort stund och försök igen."
  });
}
