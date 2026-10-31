import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useT } from "../i18n/LanguageContext";

/**
 * En bifogad bild i full storlek, med kryss i hörnet. Krysset, Esc eller ett
 * tryck bredvid bilden stänger.
 *
 * Portalas till <body> av samma skäl som ConsultationFirstModal: formulärkortet
 * ligger i sektioner med transform.
 */
export function ImageLightbox({ image, label, onClose }) {
  const t = useT();
  const closeRef = useRef(null);
  // onClose skapas på nytt vid varje rendering av formuläret; effekten ska bara
  // köras när bilden byts, annars hoppar fokus och sidans rullning fram och tillbaka.
  const closeLatest = useRef(onClose);
  closeLatest.current = onClose;

  useEffect(() => {
    if (!image) return undefined;
    const previousFocus = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeLatest.current();
      } else if (event.key === "Tab") {
        // Krysset är det enda som går att fokusera här.
        event.preventDefault();
        closeRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
      previousFocus?.focus?.();
    };
  }, [image]);

  if (!image || typeof document === "undefined") return null;

  return createPortal(
    <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <img
        className="image-lightbox__img"
        src={image.previewUrl}
        alt={label}
        onClick={(event) => event.stopPropagation()}
      />
      <button
        ref={closeRef}
        className="image-lightbox__close"
        type="button"
        onClick={onClose}
        aria-label={t("leadForm.imageViewClose")}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
        </svg>
      </button>
    </div>,
    document.body
  );
}
