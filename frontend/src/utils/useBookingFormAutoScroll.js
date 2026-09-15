import { useEffect } from "react";
import { isBioLinkVisit } from "./bioLinkVisit";

// Sidan besökaren landade på. En studiosida man navigerat till inifrån sajten
// ska inte hoppa, även om fliken en gång öppnades från Instagram.
const LANDING_PATHNAME = typeof window === "undefined" ? "" : window.location.pathname;

// ThemedStudioPage har ett eget rubrikkort ovanför formuläret; den vanliga
// studiosidan har bara formuläret.
const TARGET_SELECTORS = ["[data-booking-anchor]", "#studio-form"];

const WAIT_FOR_FORM_MS = 8000;
const SETTLE_DELAY_MS = 350;
// Bilder ovanför formuläret som laddas klart efter hoppet trycker ner det.
// Så länge besökaren inte själv rört sidan följer vi med.
const FOLLOW_LAYOUT_MS = 2500;
const GAP_BELOW_HEADER_PX = 12;

function findTarget() {
  for (const selector of TARGET_SELECTORS) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  return null;
}

function isScrollContainer(element) {
  const { overflowX, overflowY } = getComputedStyle(element);
  return ![overflowX, overflowY].every((value) => value === "visible" || value === "clip");
}

// Hur mycket av toppen headern täcker när sidan är nerscrollad. En sticky
// header fastnar bara mot viewporten om ingen förälder scrollar — och body
// blir en scrollbehållare när både html och body har overflow-x: hidden. Då
// följer headern med ut ur bild och ska inte räknas bort.
function headerOverlapPx() {
  const header = document.querySelector(".site-header");
  if (!header) return 0;

  const { position } = getComputedStyle(header);
  if (position === "fixed") return header.offsetHeight;
  if (position !== "sticky") return 0;

  for (let element = header.parentElement; element && element !== document.documentElement; element = element.parentElement) {
    if (element === document.body && !isScrollContainer(document.documentElement)) continue;
    if (isScrollContainer(element)) return 0;
  }
  return header.offsetHeight;
}

function scrollToTarget(target) {
  const top = target.getBoundingClientRect().top + window.scrollY - headerOverlapPx() - GAP_BELOW_HEADER_PX;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? "auto" : "smooth" });
}

/**
 * Scrollar ner till bokningsformuläret när besökaren kommer via studions
 * biolänk (Instagram, TikTok, Facebook eller en referral-länk från CRM:et).
 *
 * Ligger i AppShell av samma skäl som besöksmätningen: studiosidan renderas av
 * två komponenter och beteendet får inte hamna i bara den ena.
 *
 * Hoppar en gång per flik och studio — omladdning och bakåtnavigering lämnar
 * besökaren där hen var. En explicit #ankare i länken vinner, och så fort
 * besökaren själv scrollar, trycker eller skriver avbryts allt.
 */
export function useBookingFormAutoScroll(slug) {
  useEffect(() => {
    if (!slug || window.location.pathname !== LANDING_PATHNAME || window.location.hash) return;
    if (!isBioLinkVisit({
      search: window.location.search,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    })) return;

    const storageKey = `inkrevenue-studio-autoscrolled:${slug}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
    } catch {
      // Utan sessionStorage hoppar vi varje gång hellre än aldrig.
    }

    const timers = [];
    let waitTimer = 0;
    let mutationObserver = null;
    let resizeObserver = null;

    const INTERACTION_EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"];

    function cleanup() {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(waitTimer);
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      INTERACTION_EVENTS.forEach((type) => window.removeEventListener(type, cleanup));
    }

    INTERACTION_EVENTS.forEach((type) => window.addEventListener(type, cleanup, { passive: true }));

    function start(target) {
      window.clearTimeout(waitTimer);
      mutationObserver?.disconnect();
      timers.push(window.setTimeout(() => {
        try {
          window.sessionStorage.setItem(storageKey, "1");
        } catch {
          // se ovan
        }

        scrollToTarget(target);

        if (typeof ResizeObserver === "function") {
          resizeObserver = new ResizeObserver(() => scrollToTarget(target));
          resizeObserver.observe(document.body);
        }
        timers.push(window.setTimeout(cleanup, FOLLOW_LAYOUT_MS));
      }, SETTLE_DELAY_MS));
    }

    // Formuläret finns först när studion hämtats, så vi väntar in det.
    const existing = findTarget();
    if (existing) {
      start(existing);
    } else {
      mutationObserver = new MutationObserver(() => {
        const target = findTarget();
        if (target) start(target);
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
      waitTimer = window.setTimeout(cleanup, WAIT_FOR_FORM_MS);
    }

    return cleanup;
  }, [slug]);
}
