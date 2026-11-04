import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { recordTryOnEvent } from "../services/publicSiteApi";

// studio=: kundvyn läser studions motiv i /tryon/forval/<slug>/ när de finns där.
// Än så länge kopieras bara forval/alla/ hit (repot är publikt), så utan lista visas allas.
// lang=: kundvyn visas på sidans språk (sv eller en), inte på webbläsarens.
const tryOnUrl = (slug, language) =>
  `/tryon/prova.html?inbaddad&lang=${encodeURIComponent(language)}${slug ? `&studio=${encodeURIComponent(slug)}` : ""}`;

// Stegen som kundvyn rapporterar (tryon:event) och som räknas i CRM:et.
const TRY_ON_EVENTS = new Set(["opened", "photo", "motif", "added"]);

async function toFile(image) {
  const blob = await (await fetch(image.dataUrl)).blob();
  return new File([blob], image.fileName, { type: image.contentType });
}

/**
 * Prova tatueringen på kroppen, inne i förfrågan. Kundvyn från tryon-lab ligger
 * som statiska filer i public/tryon. De kopieras dit med `npm run till-inkrevenue`
 * i tryon-lab, så ändra dem där, inte här.
 *
 * Kundvyn öppnas i en iframe i helskärm. Den får bilderna som redan är bifogade
 * som motiv. Den lämnar tillbaka bilden på kroppen, och originalet om kunden lade
 * in ett nytt motiv. De blir inspirationsbilder i förfrågan, så att studion har dem
 * som referens. Iframen ligger kvar när kunden stänger, så provningen finns kvar
 * om den öppnas igen.
 *
 * Portalas till <body> av samma skäl som ConsultationFirstModal: formulärkortet
 * ligger i sektioner med transform.
 *
 * Kundvyn rapporterar stegen (öppnad, foto, motiv, lagd i förfrågan) med
 * tryon:event, och de räknas per studio i CRM:et. Bara antal, inga bilder och
 * inget som pekar ut kunden.
 */
export function TryOnLauncher({ slug, images, disabled, onImages }) {
  const { t, language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const frameRef = useRef(null);
  const overlayRef = useRef(null);
  const buttonRef = useRef(null);
  const latest = useRef({ images, onImages, slug });
  latest.current = { images, onImages, slug };

  useEffect(() => {
    if (!mounted) return undefined;

    async function handleMessage(event) {
      const frame = frameRef.current;
      if (!frame || event.source !== frame.contentWindow || event.origin !== window.location.origin) return;
      const data = event.data || {};
      if (data.type === "tryon:ready") {
        // Bilderna från en tidigare provning skickas inte tillbaka som motiv.
        const motifs = latest.current.images.filter((image) => image.source !== "tryon");
        const files = await Promise.all(motifs.map(toFile));
        frame.contentWindow.postMessage({ type: "tryon:motifs", files }, window.location.origin);
      } else if (data.type === "tryon:event" && TRY_ON_EVENTS.has(data.event)) {
        if (latest.current.slug) recordTryOnEvent(latest.current.slug, data.event);
      } else if (data.type === "tryon:close") {
        setOpen(false);
      } else if (data.type === "tryon:send" && Array.isArray(data.files)) {
        setOpen(false);
        latest.current.onImages(data.files);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [mounted]);

  // Sidan bakom rullar inte medan provningen är öppen, och fokus går tillbaka till knappen efteråt.
  useEffect(() => {
    if (!open) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    frameRef.current?.focus();
    const button = buttonRef.current;
    return () => {
      document.body.style.overflow = overflow;
      button?.focus();
    };
  }, [open]);

  // Rutan följer den yta som syns. I iOS Safari kan den ligga förskjuten mot
  // position: fixed, till exempel när tangentbordet just har stängts efter att
  // kunden skrev i formuläret. Då hamnade provningens kryss under statusraden,
  // där tryck inte går fram.
  useEffect(() => {
    const overlay = overlayRef.current;
    const viewport = window.visualViewport;
    if (!open || !overlay || !viewport) return undefined;
    function fit() {
      Object.assign(overlay.style, {
        top: `${viewport.offsetTop}px`,
        left: `${viewport.offsetLeft}px`,
        width: `${viewport.width}px`,
        height: `${viewport.height}px`
      });
    }
    fit();
    viewport.addEventListener("resize", fit);
    viewport.addEventListener("scroll", fit);
    return () => {
      viewport.removeEventListener("resize", fit);
      viewport.removeEventListener("scroll", fit);
      Object.assign(overlay.style, { top: "", left: "", width: "", height: "" });
    };
  }, [open]);

  return (
    <>
      {/* aria-disabled i stället för disabled: medan bilderna bearbetas efter en provning ska fokus kunna ligga kvar på knappen. */}
      <button
        ref={buttonRef}
        className="tryon-launch"
        type="button"
        onClick={() => {
          if (disabled) return;
          setMounted(true);
          setOpen(true);
        }}
        aria-disabled={disabled || undefined}
      >
        <span className="tryon-launch__mark" aria-hidden="true" />
        <span className="tryon-launch__text">
          <strong>{t("leadForm.tryOnButton")}</strong>
          <span>{t("leadForm.tryOnHint")}</span>
        </span>
      </button>
      {mounted && typeof document !== "undefined"
        ? createPortal(
            <div ref={overlayRef} className="tryon-overlay" role="dialog" aria-modal="true" aria-label={t("leadForm.tryOnTitle")} hidden={!open}>
              <iframe ref={frameRef} className="tryon-overlay__frame" src={tryOnUrl(slug, language)} title={t("leadForm.tryOnTitle")} />
            </div>,
            document.body
          )
        : null}
    </>
  );
}
