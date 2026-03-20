import { useRef, useState } from "react";
import { createPublicStudioLead } from "../services/publicSiteApi";
import { getTrackingPayload } from "../utils/tracking";
import { prepareLeadImageUpload } from "../utils/prepareLeadImageUpload";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  tattooStyle: "",
  placement: "",
  size: "",
  budget: "",
  description: "",
  privacyConsent: false,
  marketingConsent: false,
  website: ""
};

export function StudioLeadForm({ studio, introText = "" }) {
  const [formData, setFormData] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [inspirationImage, setInspirationImage] = useState(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const canSubmit = Boolean(studio?.slug);
  const fileInputRef = useRef(null);

  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) {
      setStatus({
        state: "error",
        message:
          studio?.previewDisabledMessage ||
          "Den här demosidan är inte kopplad till en riktig studio i CRM ännu."
      });
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      setStatus({
        state: "error",
        message: "Ange minst e-post eller telefon så att studion kan nå dig."
      });
      return;
    }

    setStatus({ state: "loading", message: "Skickar din förfrågan..." });

    try {
      const response = await createPublicStudioLead(studio.slug, {
        ...formData,
        inspirationImage: inspirationImage
          ? {
              fileName: inspirationImage.fileName,
              contentType: inspirationImage.contentType,
              dataUrl: inspirationImage.dataUrl
            }
          : null,
        ...getTrackingPayload()
      });

      setStatus({
        state: "success",
        message:
          response?.successMessage ||
          "Tack! Din förfrågan är skickad. Studion återkopplar normalt inom 24 timmar via e-post eller telefon."
      });
      setFormData(initialForm);
      setInspirationImage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setStatus({
        state: "error",
        message:
          error.message ||
          "Det gick inte att skicka just nu. Kontrollera dina uppgifter och försök igen lite senare."
      });
    }
  }

  return (
    <form className="booking-form studio-lead-form" onSubmit={handleSubmit} id="studio-form">
      <p className="form-note">
        {introText ||
          "Berätta om motiv, stil och ungefärlig storlek så blir det lättare för studion att ge ett relevant första svar."}
      </p>

      <div className="form-grid">
        <label htmlFor="lead-name">
          Namn
          <input
            id="lead-name"
            type="text"
            name="name"
            placeholder="Ditt namn"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="lead-email">
          E-post
          <input
            id="lead-email"
            type="email"
            name="email"
            placeholder="namn@mail.se"
            value={formData.email}
            onChange={handleChange}
          />
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
          />
        </label>

        <label htmlFor="lead-style">
          Stil
          <input
            id="lead-style"
            type="text"
            name="tattooStyle"
            placeholder="Fineline, realism, blackwork..."
            value={formData.tattooStyle}
            onChange={handleChange}
          />
        </label>

        <label htmlFor="lead-placement">
          Placering
          <input
            id="lead-placement"
            type="text"
            name="placement"
            placeholder="Arm, rygg, ben..."
            value={formData.placement}
            onChange={handleChange}
          />
        </label>

        <label htmlFor="lead-size">
          Storlek
          <input
            id="lead-size"
            type="text"
            name="size"
            placeholder="Liten, medium eller i cm"
            value={formData.size}
            onChange={handleChange}
          />
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

      <label htmlFor="lead-description">
        Berätta om din tatuering
        <textarea
          id="lead-description"
          name="description"
          rows="5"
          placeholder="Beskriv motiv, känsla, referenser och allt som är viktigt för studion att veta."
          value={formData.description}
          onChange={handleChange}
          required
        />
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

      <label className="consent-row" htmlFor="lead-privacyConsent">
        <input
          id="lead-privacyConsent"
          type="checkbox"
          name="privacyConsent"
          checked={formData.privacyConsent}
          onChange={handleChange}
          required
        />
        <span>
          Jag godkänner att {studio.name} får spara mina uppgifter för att kunna svara på min
          förfrågan.
        </span>
      </label>

      <label className="consent-row" htmlFor="lead-marketingConsent">
        <input
          id="lead-marketingConsent"
          type="checkbox"
          name="marketingConsent"
          checked={formData.marketingConsent}
          onChange={handleChange}
        />
        <span>Jag vill kunna få återkoppling och uppföljning från studion via mejl eller sms.</span>
      </label>

      <button
        className="btn btn-primary"
        type="submit"
        disabled={status.state === "loading" || imageProcessing || !canSubmit}
      >
        {status.state === "loading" ? "Skickar..." : "Skicka förfrågan"}
      </button>

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
    </form>
  );
}
