import { useMemo, useState } from "react";
import { FormLegalLinks } from "./FormLegalLinks";
import { createStrategyCall } from "../services/publicSiteApi";
import { useAbandonedFormDraft } from "../hooks/useAbandonedFormDraft";
import { getTrackingPayload } from "../utils/tracking";
import { useLanguage } from "../i18n/LanguageContext";

const initialForm = {
  name: "",
  studio: "",
  email: "",
  phone: "",
  message: "",
  website: ""
};

function computeError(name, formData, touchedState, t) {
  if (!touchedState[name]) return "";
  switch (name) {
    case "name":
      return formData.name.trim().length < 2 ? t("strategyForm.errorName") : "";
    case "studio":
      return formData.studio.trim().length < 2 ? t("strategyForm.errorStudio") : "";
    case "email":
      return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
        ? t("strategyForm.errorEmail")
        : "";
    default:
      return "";
  }
}

export function StrategyCallForm() {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [touched, setTouched] = useState({});
  // Påminnelser per mejl eller SMS kräver samtycke i förväg (MFL 19 §).
  const [reminderConsent, setReminderConsent] = useState(false);
  const draftPayload = useMemo(
    () => ({
      name: formData.name,
      studio: formData.studio,
      email: formData.email,
      phone: formData.phone,
      message: formData.message,
      // Betyder "har fått informationen" (FormLegalLinks vid knappen).
      privacyConsent: true,
      marketingConsent: false,
      reminderConsent,
      website: formData.website
    }),
    [formData, reminderConsent]
  );
  const { draftId, clearDraft } = useAbandonedFormDraft({
    type: "strategy_call",
    payload: draftPayload
  });

  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function handleBlur(event) {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  function getFieldError(name) {
    return computeError(name, formData, touched, t);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const allTouched = { name: true, studio: true, email: true };
    setTouched(allTouched);

    if (
      computeError("name", formData, allTouched, t) ||
      computeError("studio", formData, allTouched, t) ||
      computeError("email", formData, allTouched, t)
    ) {
      setStatus({
        state: "error",
        message: t("strategyForm.errorFields")
      });
      return;
    }

    setStatus({ state: "loading", message: t("strategyForm.sending") });

    try {
      const response = await createStrategyCall({
        ...formData,
        privacyConsent: true,
        marketingConsent: false,
        draftId,
        // Så att vi vet vilket språk avsändaren läste sajten på när vi svarar.
        language,
        ...getTrackingPayload()
      });

      setStatus({
        state: "success",
        // Backendens standardsvar är alltid svenskt — på engelska visar vi vårt
        // eget i stället för att svara en engelsk besökare på svenska.
        message:
          (language === "sv" && response?.successMessage) || t("strategyForm.success")
      });
      setFormData(initialForm);
      setTouched({});
      setReminderConsent(false);
      clearDraft();
    } catch (error) {
      setStatus({
        state: "error",
        message: error.message || t("strategyForm.errorGeneric")
      });
    }
  }

  return (
    <form className="booking-form" data-reveal="right" onSubmit={handleSubmit}>
      <p className="form-note">{t("strategyForm.note")}</p>

      <label htmlFor="strategy-name" className={getFieldError("name") ? "has-error" : ""}>
        {t("strategyForm.name")}
        <input
          id="strategy-name"
          type="text"
          name="name"
          placeholder={t("strategyForm.namePlaceholder")}
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

      <label htmlFor="strategy-studio" className={getFieldError("studio") ? "has-error" : ""}>
        {t("strategyForm.studio")}
        <input
          id="strategy-studio"
          type="text"
          name="studio"
          placeholder={t("strategyForm.studioPlaceholder")}
          value={formData.studio}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!getFieldError("studio")}
        />
        {getFieldError("studio") ? (
          <span className="field-error" role="alert">{getFieldError("studio")}</span>
        ) : null}
      </label>

      <label htmlFor="strategy-email" className={getFieldError("email") ? "has-error" : ""}>
        {t("strategyForm.email")}
        <input
          id="strategy-email"
          type="email"
          name="email"
          placeholder={t("strategyForm.emailPlaceholder")}
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!getFieldError("email")}
        />
        {getFieldError("email") ? (
          <span className="field-error" role="alert">{getFieldError("email")}</span>
        ) : null}
      </label>

      <label htmlFor="strategy-phone">
        {t("strategyForm.phone")}
        <input
          id="strategy-phone"
          type="tel"
          name="phone"
          placeholder={t("strategyForm.phonePlaceholder")}
          value={formData.phone}
          onChange={handleChange}
        />
      </label>

      <label htmlFor="strategy-message">
        {t("strategyForm.message")}
        <textarea
          id="strategy-message"
          name="message"
          rows="4"
          placeholder={t("strategyForm.messagePlaceholder")}
          value={formData.message}
          onChange={handleChange}
        />
      </label>

      <label className="consent-row" htmlFor="strategy-reminderConsent">
        <input
          id="strategy-reminderConsent"
          type="checkbox"
          checked={reminderConsent}
          onChange={(event) => setReminderConsent(event.target.checked)}
        />
        <span>{t("strategyForm.reminderConsent")}</span>
      </label>

      <div className="hidden-trap" aria-hidden="true">
        <label htmlFor="strategy-website">
          {t("strategyForm.honeypot")}
          <input
            id="strategy-website"
            type="text"
            name="website"
            tabIndex="-1"
            autoComplete="off"
            value={formData.website}
            onChange={handleChange}
          />
        </label>
      </div>

      <FormLegalLinks />

      <button className="btn btn-primary" type="submit" disabled={status.state === "loading"}>
        {status.state === "loading" ? t("strategyForm.submitting") : t("strategyForm.submit")}
      </button>

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
    </form>
  );
}
