import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useT } from "../i18n/LanguageContext";

const FOCUSABLE = 'button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Frågan om en konsultation först, mellan formulärets första och andra steg.
 * Ett svar för kunden vidare; stängs rutan utan svar står kunden kvar på steg 1.
 *
 * Portalas till <body>: formulärkortet ligger i sektioner med reveal-animationer
 * (transform), och då hade `position: fixed` räknats mot kortet i stället för
 * fönstret.
 */
export function ConsultationFirstModal({ isOpen, minutes, currentAnswer, onAnswer, onClose }) {
  const t = useT();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    (dialog?.querySelector(".consultation-modal__actions button") || dialog?.querySelector(FOCUSABLE))?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const elements = Array.from(dialog.querySelectorAll(FOCUSABLE));
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const options = [
    { value: true, label: t("leadForm.consultationFirstYes"), className: "btn btn-secondary" },
    { value: false, label: t("leadForm.consultationFirstNo"), className: "btn btn-primary" }
  ];

  return createPortal(
    <div className="consultation-modal" role="presentation">
      <div className="consultation-modal__backdrop" onClick={onClose} />
      <section
        ref={dialogRef}
        className="consultation-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultation-modal-title"
        aria-describedby="consultation-modal-hint"
      >
        <button
          className="consultation-modal__close"
          type="button"
          onClick={onClose}
          aria-label={t("leadForm.consultationFirstClose")}
        >
          ×
        </button>
        <h2 id="consultation-modal-title" className="consultation-modal__title">
          {t("leadForm.consultationFirstQuestion", { minutes })}
        </h2>
        <p id="consultation-modal-hint" className="consultation-modal__hint">
          {t("leadForm.consultationFirstHint")}
        </p>
        <div className="consultation-modal__actions">
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              className={option.className}
              aria-pressed={currentAnswer === option.value}
              onClick={() => onAnswer(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </div>,
    document.body
  );
}
