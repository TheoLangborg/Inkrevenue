import { useState } from "react";
import { createStrategyCall } from "../services/publicSiteApi";
import { getTrackingPayload } from "../utils/tracking";

const initialForm = {
  name: "",
  studio: "",
  email: "",
  phone: "",
  message: "",
  privacyConsent: false,
  marketingConsent: false,
  website: ""
};

export function StrategyCallForm() {
  const [formData, setFormData] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ state: "loading", message: "Skickar bokningsförfrågan..." });

    try {
      const response = await createStrategyCall({
        ...formData,
        ...getTrackingPayload()
      });

      setStatus({
        state: "success",
        message:
          response?.successMessage ||
          "Tack! Vi har tagit emot din förfrågan och återkommer normalt inom 24 timmar på vardagar."
      });
      setFormData(initialForm);
      return;

    } catch (error) {
      setStatus({
        state: "error",
        message:
          error.message ||
          "Det gick inte att skicka just nu. Kontrollera dina uppgifter och försök igen lite senare."
      });
      return;
    }
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <p className="form-note">
        Berätta kort om nuläge och vad ni vill ha hjälp med, så kan vi göra första samtalet mer
        relevant.
      </p>

      <label htmlFor="strategy-name">
        Namn
        <input
          id="strategy-name"
          type="text"
          name="name"
          placeholder="Ditt namn"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </label>

      <label htmlFor="strategy-studio">
        Studio
        <input
          id="strategy-studio"
          type="text"
          name="studio"
          placeholder="Studions namn"
          value={formData.studio}
          onChange={handleChange}
          required
        />
      </label>

      <label htmlFor="strategy-email">
        E-post
        <input
          id="strategy-email"
          type="email"
          name="email"
          placeholder="namn@studio.se"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </label>

      <label htmlFor="strategy-phone">
        Telefonnummer
        <input
          id="strategy-phone"
          type="tel"
          name="phone"
          placeholder="070-000 00 00"
          value={formData.phone}
          onChange={handleChange}
        />
      </label>

      <label htmlFor="strategy-message">
        Meddelande
        <textarea
          id="strategy-message"
          name="message"
          rows="4"
          placeholder="Berätta kort om era mål och vilken typ av hjälp ni söker"
          value={formData.message}
          onChange={handleChange}
        />
      </label>

      <div className="hidden-trap" aria-hidden="true">
        <label htmlFor="strategy-website">
          Lämna detta fält tomt
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

      <label className="consent-row" htmlFor="strategy-privacyConsent">
        <input
          id="strategy-privacyConsent"
          type="checkbox"
          name="privacyConsent"
          checked={formData.privacyConsent}
          onChange={handleChange}
          required
        />
        <span>
          Jag godkänner att Ink Revenue sparar mina uppgifter för att kunna kontakta mig om
          strategisamtal och offert.
        </span>
      </label>

      <label className="consent-row" htmlFor="strategy-marketingConsent">
        <input
          id="strategy-marketingConsent"
          type="checkbox"
          name="marketingConsent"
          checked={formData.marketingConsent}
          onChange={handleChange}
        />
        <span>Jag vill även kunna få uppföljning och relevant information via mejl.</span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={status.state === "loading"}>
        {status.state === "loading" ? "Skickar..." : "Skicka bokningsförfrågan"}
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
