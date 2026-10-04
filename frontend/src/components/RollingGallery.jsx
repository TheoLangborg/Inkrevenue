import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "../i18n/LanguageContext";
import { StudioImage } from "./StudioImage";

// Bildernas visade bredd, för småversionerna (utils/imageVariants.js). Korten
// är stående och bilden täcker dem (object-fit: cover), så en liggande bild
// visas bredare än kortet. Därför används kortens höjd: 300, 260 och 200 px.
const CARD_SIZES = "(max-width: 560px) 200px, (max-width: 900px) 260px, 300px";
// size="large" (.rg--large i App.css): korten är 240, 300 och 380 px höga.
const CARD_SIZES_LARGE = "(max-width: 560px) 240px, (max-width: 900px) 300px, 380px";
const GRID_SIZES = "240px";
const LIGHTBOX_SIZES = "90vw";

// Antal bilder då bandet alltid rullar, oavsett mätning.
const ALWAYS_ROLL_FROM = 5;

/**
 * RollingGallery
 *
 * Visar studions galleribilder på en enda rad.
 *  - Får alla bilder plats på raden → statiskt, centrerat (som idag).
 *  - Blir de för många för radbredden → sömlöst rullande band (marquee).
 *    Antalet som ryms avgörs av skärmbredden: ~4–5 på desktop, ~2–3 på mobil.
 *  - Klick på en bild → närbild (lightbox) med bläddring.
 *  - "Se hela portföljen" → overlay med alla bilder, klick öppnar närbild.
 *
 * SSR-säker: mätning/animation sker enbart i effekter (klientsidan).
 * Förstarender är alltid statiskt läge, så hydrering matchar.
 */
// size="large": större kort och kort tonning i kanterna, för ett band som går
// kant i kant. Sidan lägger då bandet utanför sin innehållskolumn och kan sätta
// --rg-edge (avståndet till fönsterkanten för knappraden och den rullbara raden).
export function RollingGallery({ images = [], studioName = "", size = "default" }) {
  const large = size === "large";
  const cardSizes = large ? CARD_SIZES_LARGE : CARD_SIZES;
  const t = useT();
  const list = images.filter(Boolean);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const draggedRef = useRef(false);

  const [mode, setMode] = useState("static"); // "static" | "marquee" | "scroll"
  const [lightbox, setLightbox] = useState(null); // index eller null
  const [portfolioOpen, setPortfolioOpen] = useState(false);

  const count = list.length;

  const openAt = useCallback(
    (i) => () => {
      if (draggedRef.current) {
        draggedRef.current = false;
        return;
      }
      setLightbox(i);
    },
    []
  );

  const step = useCallback(
    (dir) => setLightbox((i) => (i === null ? null : (i + dir + count) % count)),
    [count]
  );

  // ── Mät om raden får plats; välj läge (statiskt / band / scroll) ──
  useEffect(() => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track || count === 0) return undefined;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const check = () => {
      // Från fem kort och uppåt rullar bandet alltid. Fem kort är bredare än
      // innehållskolumnen (1120 px) på varje brytpunkt, så mätningen säger ändå
      // samma sak — men den är beroende av att layouten hunnit sätta sig, och
      // hamnar den fel blir korten stillastående och de sista permanent osynliga
      // utanför kanten. Tröskeln gör beteendet deterministiskt.
      if (count >= ALWAYS_ROLL_FROM) {
        setMode(reduce ? "scroll" : "marquee");
        return;
      }

      const cards = Array.from(track.children).slice(0, count);
      if (!cards.length) {
        setMode("static");
        return;
      }
      const first = cards[0];
      const last = cards[cards.length - 1];
      const oneSetWidth = last.offsetLeft + last.offsetWidth - first.offsetLeft;
      if (oneSetWidth <= vp.clientWidth + 1) {
        setMode("static");
      } else {
        setMode(reduce ? "scroll" : "marquee");
      }
    };

    check();

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(check);
      ro.observe(vp);
    }
    window.addEventListener("resize", check);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [count]);

  // ── Marquee-motor: rullar bandet + drag + hover-paus ──
  // Rörelsen är en Web Animation på transform. Den körs i webbläsarens
  // kompositor och fortsätter jämnt när huvudtråden har annat för sig (React,
  // bildavkodning, skräpsamling). Tidigare satte en rAF-loop transformen varje
  // bildruta, och då hackade bandet till så fort sidan hade annat att göra
  // (användaren 2026-10-04). Drag och hover-paus pausar animationen och flyttar
  // dess tid i stället för att skriva transformen själva.
  useEffect(() => {
    if (mode !== "marquee") return undefined;
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track) return undefined;
    if (typeof track.animate !== "function") {
      setMode("scroll");
      return undefined;
    }

    // Fart i px/sekund, oberoende av skärmens bildfrekvens.
    const SPEED = 30;
    let animation = null;
    let duration = 0;
    let paused = false;
    let dragging = false;
    let startX = 0;
    let startOffset = 0;
    let movedAbs = 0;
    let resumeTimer = 0;

    // Bandet är bilderna två gånger. Ett varv = avståndet till första kopian.
    const measureSet = () => {
      const cards = track.children;
      if (count < 1 || cards.length < count * 2) return 0;
      return cards[count].offsetLeft - cards[0].offsetLeft;
    };
    let setWidth = measureSet();

    // Förskjutningen i px (0 till -setWidth) ↔ animationens tid.
    const getOffset = () => {
      if (!animation || !duration) return 0;
      const time = Number(animation.currentTime) || 0;
      return -((time % duration) / duration) * setWidth;
    };
    const setOffset = (offset) => {
      if (!animation || !setWidth) return;
      let wrapped = offset % setWidth;
      if (wrapped > 0) wrapped -= setWidth;
      animation.currentTime = (-wrapped / setWidth) * duration;
    };

    const start = (offset) => {
      animation?.cancel();
      animation = null;
      if (setWidth <= 0) return;
      duration = (setWidth / SPEED) * 1000;
      animation = track.animate(
        [{ transform: "translateX(0px)" }, { transform: `translateX(${-setWidth}px)` }],
        { duration, iterations: Infinity, easing: "linear" }
      );
      setOffset(offset);
      if (paused) animation.pause();
    };
    start(0);

    const resume = () => {
      paused = false;
      animation?.play();
    };
    const onEnter = () => {
      paused = true;
      animation?.pause();
    };
    const onLeave = () => {
      if (!dragging) resume();
    };
    const onDown = (e) => {
      window.clearTimeout(resumeTimer);
      dragging = true;
      paused = true;
      animation?.pause();
      startX = e.clientX;
      startOffset = getOffset();
      movedAbs = 0;
      vp.classList.add("is-drag");
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      movedAbs = Math.max(movedAbs, Math.abs(dx));
      setOffset(startOffset + dx);
    };
    // pointercancel räknas som ett släpp: på mobil tar sidans lodräta scroll
    // över fingret (touch-action: pan-y) och då kommer inget pointerup. Utan det
    // stod bandet still tills nästa tryck.
    const onUp = () => {
      dragging = false;
      draggedRef.current = movedAbs >= 6; // äkta drag → svälj efterföljande klick
      vp.classList.remove("is-drag");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      resumeTimer = window.setTimeout(resume, 250);
    };
    // Korten byter storlek vid brytpunkterna. Behåll var i varvet bandet är.
    const onResize = () => {
      const next = measureSet();
      if (next === setWidth) return;
      const progress = setWidth ? getOffset() / setWidth : 0;
      setWidth = next;
      start(progress * setWidth);
    };

    vp.addEventListener("pointerenter", onEnter);
    vp.addEventListener("pointerleave", onLeave);
    vp.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(resumeTimer);
      animation?.cancel();
      vp.removeEventListener("pointerenter", onEnter);
      vp.removeEventListener("pointerleave", onLeave);
      vp.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", onResize);
    };
  }, [mode, count]);

  // ── Tangentbord + scroll-lås när en overlay är öppen ──
  useEffect(() => {
    const overlayOpen = lightbox !== null || portfolioOpen;
    if (!overlayOpen) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape") {
        if (lightbox !== null) setLightbox(null);
        else setPortfolioOpen(false);
      } else if (lightbox !== null && e.key === "ArrowRight") {
        step(1);
      } else if (lightbox !== null && e.key === "ArrowLeft") {
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, portfolioOpen, step]);

  if (!count) return null;

  const renderCard = (url, i, clone = false) => (
    <button
      type="button"
      key={(clone ? "c" : "") + i}
      className="rg-card"
      data-idx={i}
      onClick={openAt(i)}
      aria-label={t("gallery.openImage", { index: i + 1, total: count })}
      tabIndex={clone ? -1 : 0}
      aria-hidden={clone ? "true" : undefined}
    >
      <StudioImage
        src={url}
        widths={[480, 1024]}
        sizes={cardSizes}
        alt={t("gallery.imageAlt", { studio: studioName, index: i + 1 })}
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    </button>
  );

  const vpClass =
    "rg-viewport" +
    (mode === "marquee" ? " rg-viewport--marquee" : "") +
    (mode === "scroll" ? " rg-viewport--scroll" : "");
  const trackClass = "rg-track" + (mode === "static" ? " rg-track--center" : "");

  return (
    <div className={large ? "rg rg--large" : "rg"}>
      <div className={vpClass} ref={viewportRef}>
        <div className={trackClass} ref={trackRef}>
          {list.map((url, i) => renderCard(url, i))}
          {mode === "marquee" ? list.map((url, i) => renderCard(url, i, true)) : null}
        </div>
      </div>

      <div className="rg-cta-row">
        {/* Bara ~4 kort får plats i innehållskolumnen. Räknaren säger att det
            finns fler bakom kanten även om bandet står stilla just då. */}
        {count > 1 ? (
          <span className="rg-count">{t("gallery.imageCount", { count })}</span>
        ) : null}
        <button type="button" className="rg-portfolio-link" onClick={() => setPortfolioOpen(true)}>
          {t("gallery.seePortfolio")}
          <span className="rg-arrow" aria-hidden="true">→</span>
        </button>
      </div>

      {/* Portfölj-overlay: alla bilder i ett rutnät */}
      {portfolioOpen ? (
        <div
          className="rg-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("gallery.portfolioAria", { studio: studioName })}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPortfolioOpen(false);
          }}
        >
          <button
            className="rg-overlay-close"
            type="button"
            onClick={() => setPortfolioOpen(false)}
            aria-label={t("gallery.closePortfolio")}
          >
            ✕
          </button>
          <div className="rg-portfolio">
            <p className="rg-portfolio-eyebrow">{t("gallery.portfolioEyebrow")}</p>
            <h3 className="rg-portfolio-title">{studioName}</h3>
            <p className="rg-portfolio-sub">{t("gallery.portfolioSub")}</p>
            <div className="rg-portfolio-grid">
              {list.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  className="rg-card rg-card--grid"
                  onClick={() => setLightbox(i)}
                  aria-label={t("gallery.openImage", { index: i + 1, total: count })}
                >
                  <StudioImage
                    src={url}
                    widths={[480, 1024]}
                    sizes={GRID_SIZES}
                    alt={t("gallery.imageAlt", { studio: studioName, index: i + 1 })}
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Lightbox: en bild i närbild */}
      {lightbox !== null ? (
        <div
          className="rg-overlay rg-overlay--lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t("gallery.lightboxAria", { index: lightbox + 1, total: count })}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightbox(null);
          }}
        >
          <button
            className="rg-overlay-close"
            type="button"
            onClick={() => setLightbox(null)}
            aria-label={t("gallery.close")}
          >
            ✕
          </button>
          {count > 1 ? (
            <button
              className="rg-lb-nav rg-lb-prev"
              type="button"
              onClick={() => step(-1)}
              aria-label={t("gallery.prevImage")}
            >
              ‹
            </button>
          ) : null}
          <figure className="rg-lb-figure">
            <StudioImage
              src={list[lightbox]}
              widths={[1024, 2048]}
              sizes={LIGHTBOX_SIZES}
              alt={t("gallery.imageAlt", { studio: studioName, index: lightbox + 1 })}
            />
            <figcaption className="rg-lb-counter">
              {lightbox + 1} / {count}
            </figcaption>
          </figure>
          {count > 1 ? (
            <button
              className="rg-lb-nav rg-lb-next"
              type="button"
              onClick={() => step(1)}
              aria-label={t("gallery.nextImage")}
            >
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
