import { useState } from "react";

const initialForm = {
  name: "",
  studio: "",
  email: "",
  phone: "",
  message: "",
  privacyConsent: false,
  marketingConsent: false
};

function getTrackingPayload() {
  if (typeof window === "undefined") {
    return {};
  }

  const currentUrl = new URL(window.location.href);

  return {
    pageUrl: currentUrl.toString(),
    referrerUrl: document.referrer || "",
    utmSource: currentUrl.searchParams.get("utm_source") || "",
    utmMedium: currentUrl.searchParams.get("utm_medium") || "",
    utmCampaign: currentUrl.searchParams.get("utm_campaign") || "",
    utmContent: currentUrl.searchParams.get("utm_content") || "",
    utmTerm: currentUrl.searchParams.get("utm_term") || "",
    gclid: currentUrl.searchParams.get("gclid") || "",
    fbclid: currentUrl.searchParams.get("fbclid") || ""
  };
}

export default function App() {
  const [formData, setFormData] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: "loading", message: "Skickar bokningsförfrågan..." });

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ...getTrackingPayload()
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Det gick inte att skicka just nu.");
      }

      setStatus({
        state: "success",
        message:
          payload?.data?.successMessage ||
          "Tack! Vi återkommer med tider för strategisamtal inom kort."
      });
      setFormData(initialForm);
    } catch (error) {
      setStatus({
        state: "error",
        message: error.message || "Det gick inte att skicka just nu. Försök igen eller mejla oss."
      });
    }
  };

  return (
    <div>
      <section className="hero" id="top">
        <div className="hero__orb hero__orb--left"></div>
        <div className="hero__orb hero__orb--right"></div>
        <div className="container hero__content">
          <div className="brand-lockup">
            <img className="brand-logo" src="/ink-revenue-logo.svg" alt="Ink Revenue logotyp" />
            <div className="brand-mark">Ink Revenue</div>
          </div>
          <h1>Vill du få in mellan 30–50 nya kunder varje månad?</h1>
          <p className="lead">
            Vi hjälper tatueringsstudior att fylla sina kalendrar med bokade
            tatueringskunder genom vårt skräddarsydda tillväxtsystem. Ni får
            faktiska bokningar – inte bara klick eller följare. Levererar vi
            inga nya kunder, betalar ni inte en krona.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="#bokning">
              Boka ett strategisamtal
            </a>
            <span className="cta-note">Kostnadsfritt och utan förpliktelser.</span>
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container grid-2">
          <div className="video-card">
            <div className="video-card__inner">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <path d="M26 20v24l20-12-20-12z" fill="currentColor" />
                <rect
                  x="4"
                  y="10"
                  width="56"
                  height="44"
                  rx="8"
                  ry="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              </svg>
            </div>
            <span className="video-card__label">Se hur det fungerar</span>
          </div>
          <div>
            <h2>
              Vad gör oss <span className="accent">UNIKA</span>?
            </h2>
            <p className="body">
              Vårt tillväxtsystem är helt unikt, då det tillåter oss att endast
              ta betalt per inbokad och betald kund. Det betyder att ni är
              garanterade resultat. Annars betalar ni inte oss en krona.
            </p>
            <div className="meter">
              <div className="meter__title">Genomsnittlig försäljningsökning</div>
              <div className="meter__value">57%</div>
              <div className="meter__bar" style={{ "--value": 57 }}></div>
            </div>
            <div className="meter">
              <div className="meter__title">Kunder som vill fortsätta efter månad ett</div>
              <div className="meter__value">87%</div>
              <div className="meter__bar" style={{ "--value": 87 }}></div>
            </div>
            <div className="meter">
              <div className="meter__title">Nöjdhet hos kunder</div>
              <div className="meter__value">97%</div>
              <div className="meter__bar" style={{ "--value": 97 }}></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--lavender">
        <div className="container grid-2">
          <div>
            <p className="eyebrow">Om oss</p>
            <h2>
              <span className="accent">Expandera</span> utan stress
            </h2>
            <p className="body">
              Vår AI-drivna byrå hjälper tatueringsstudior att växa utan att
              behöva oroa sig för kundflödet.
            </p>
            <p className="body">
              Med vår expertis inom digital marknadsföring och riktade annonser
              på sociala medier ser vi till att nya personer som vill tatuera sig
              hittar till er studio.
            </p>
            <p className="body">
              Vi fokuserar på att generera nya bokningar och fylla er kalender,
              så att ni kan lägga all energi på det ni gör bäst – att skapa
              grymma tatueringar.
            </p>
            <a className="btn btn-primary" href="#bokning">
              Boka ett strategisamtal
            </a>
          </div>
          <div className="illustration-card">
            <svg viewBox="0 0 420 320" aria-hidden="true">
              <defs>
                <linearGradient id="screen" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#4d6bff" />
                  <stop offset="1" stopColor="#6b8dff" />
                </linearGradient>
              </defs>
              <rect x="40" y="50" width="340" height="220" rx="20" fill="url(#screen)" />
              <rect x="70" y="80" width="160" height="30" rx="8" fill="#dbe4ff" />
              <rect x="70" y="130" width="260" height="24" rx="6" fill="#c2d0ff" />
              <rect x="70" y="170" width="200" height="24" rx="6" fill="#c2d0ff" />
              <circle cx="310" cy="210" r="32" fill="#ffffff" opacity="0.85" />
              <path d="M280 235h60" stroke="#2f3fa5" strokeWidth="6" strokeLinecap="round" />
              <path d="M270 255h80" stroke="#2f3fa5" strokeWidth="6" strokeLinecap="round" />
              <circle cx="60" cy="30" r="18" fill="#c8d8ff" opacity="0.7" />
              <circle cx="380" cy="40" r="12" fill="#c8d8ff" opacity="0.5" />
            </svg>
          </div>
        </div>
      </section>

      <section className="section section--lavender">
        <div className="container grid-2 grid-2--reverse">
          <div className="illustration-card">
            <svg viewBox="0 0 420 320" aria-hidden="true">
              <defs>
                <linearGradient id="shop" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#4b7bff" />
                  <stop offset="1" stopColor="#79a0ff" />
                </linearGradient>
              </defs>
              <rect x="90" y="70" width="240" height="190" rx="18" fill="url(#shop)" />
              <rect x="110" y="120" width="200" height="110" rx="12" fill="#e6f0ff" />
              <rect x="90" y="40" width="240" height="40" rx="12" fill="#c8d8ff" />
              <path d="M110 40h20v40h-20z" fill="#5f86ff" />
              <path d="M150 40h20v40h-20z" fill="#7aa0ff" />
              <path d="M190 40h20v40h-20z" fill="#5f86ff" />
              <path d="M230 40h20v40h-20z" fill="#7aa0ff" />
              <path d="M270 40h20v40h-20z" fill="#5f86ff" />
              <circle cx="130" cy="180" r="26" fill="#ffffff" />
              <path d="M120 176h20" stroke="#3d6fd1" strokeWidth="6" strokeLinecap="round" />
              <path d="M118 192h24" stroke="#3d6fd1" strokeWidth="6" strokeLinecap="round" />
              <path d="M280 210l50-50" stroke="#4b86dc" strokeWidth="16" strokeLinecap="round" />
              <path d="M240 250l70-70" stroke="#4b86dc" strokeWidth="16" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="eyebrow">Hands-Free</p>
            <h2>
              Få kunder helt <span className="accent">automatiskt</span>
            </h2>
            <p className="body">
              Vår AI-drivna byrå gör marknadsföring för tatueringsstudior enkel
              och effektiv.
            </p>
            <p className="body">
              Genom skräddarsydda annonser på sociala medier når vi personer som
              aktivt letar efter sin nästa tatuering och leder dem direkt till er
              studio.
            </p>
            <p className="body">
              När potentiella kunder visar intresse tar vårt system över. Vi
              hanterar uppföljning, konversationer och bokningar så att
              intressenter snabbt blir till faktiska tatueringsbokningar i er
              kalender.
            </p>
            <p className="body">
              Resultatet? Fler bokade tider och en fullare kalender – utan att ni
              behöver lägga tid på marknadsföring eller kunduppföljning.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--blue">
        <div className="container">
          <div className="section-title">
            <div className="line"></div>
            <h2>Vår GARANTI</h2>
            <div className="line"></div>
          </div>
          <div className="card-grid">
            <div className="card">
              <div className="card__icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <rect x="10" y="12" width="44" height="30" rx="6" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path d="M22 46h20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <path d="M18 52h28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <path d="M24 28l6 6 12-12" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <h3>100% Hands Free</h3>
              <p>
                Vår 100% Hands–Free–tjänst innebär att du kan fokusera helt på att
                tatuera medan vi tar hand om allt från marknadsföring till
                kundanskaffning.
              </p>
              <p>
                Luta dig tillbaka och se din Studio blomstra, utan att behöva
                lyfta ett finger. Vi sköter allt så att du kan njuta av en
                sömlös tillväxtresa.
              </p>
            </div>
            <div className="card">
              <div className="card__icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <rect x="12" y="16" width="40" height="36" rx="6" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path d="M20 44V28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <path d="M32 44V24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <path d="M44 44V20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Grow &amp; Scale Your Asset</h3>
              <p>
                Med vår "Grow &amp; Scale Your Asset"-tjänst, säkerställer vi att
                din verksamhet inte bara växer, utan också expanderar på ett
                hållbart sätt.
              </p>
              <p>
                Vi använder beprövade strategier för att maximera din avkastning
                och skala upp ditt företag, så att du kan se det förvandlas till
                en verklig tillgång med långsiktig framgång.
              </p>
            </div>
            <div className="card">
              <div className="card__icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path d="M18 50h28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <path d="M22 50v-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <path d="M42 50v-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <path d="M26 42h12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <path
                    d="M20 18h24l-4 18H24l-4-18z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>100% Guarantee</h3>
              <p>
                Vår "100% Guarantee" innebär att vi tar betalt enbart för
                inbokade kunder. Du betalar oss inget i förväg; varje faktura
                motsvarar redan genererad inkomst från kunden.
              </p>
              <p>Så du riskerar aldrig att ligga ute med pengar för våra tjänster.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--white results">
        <div className="results__line"></div>
        <div className="container grid-2">
          <div>
            <p className="eyebrow">Resultat</p>
            <h2>Vi pratar inte bara, vi levererar.</h2>
          </div>
          <div>
            <h2>Vi skapar ett tillväxtsystem att lita på!</h2>
            <p className="body">
              Vi bygger ett pålitligt tillväxtsystem som driver ditt företag
              framåt. Fokus ligger alltid på konkreta bokningar och ett jämnt
              inflöde av kunder.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--lavender" id="bokning">
        <div className="container booking">
          <div>
            <p className="eyebrow">Boka strategisamtal</p>
            <h2>Låt oss bestämma vilka tjänster som passar er</h2>
            <p className="body">
              Boka ett strategisamtal med oss på Ink Revenue. Fyll i formuläret
              så återkommer vi med tider för ett kostnadsfritt samtal. Vi går
              igenom era mål och väljer en plan som passar er studio.
            </p>
          </div>
          <form className="booking-form" onSubmit={handleSubmit}>
            <label htmlFor="name">
              Namn
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Ditt namn"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>
            <label htmlFor="studio">
              Studio
              <input
                id="studio"
                type="text"
                name="studio"
                placeholder="Studions namn"
                value={formData.studio}
                onChange={handleChange}
                required
              />
            </label>
            <label htmlFor="email">
              E-post
              <input
                id="email"
                type="email"
                name="email"
                placeholder="namn@studio.se"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>
            <label htmlFor="phone">
              Telefonnummer
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="070-000 00 00"
                value={formData.phone}
                onChange={handleChange}
              />
            </label>
            <label htmlFor="message">
              Meddelande
              <textarea
                id="message"
                name="message"
                rows="4"
                placeholder="Berätta kort om era mål"
                value={formData.message}
                onChange={handleChange}
              ></textarea>
            </label>
            <label className="consent-row" htmlFor="privacyConsent">
              <input
                id="privacyConsent"
                type="checkbox"
                name="privacyConsent"
                checked={formData.privacyConsent}
                onChange={handleChange}
                required
              />
              <span>
                Jag godkänner att Ink Revenue sparar mina uppgifter för att kunna
                kontakta mig om strategisamtal.
              </span>
            </label>
            <label className="consent-row" htmlFor="marketingConsent">
              <input
                id="marketingConsent"
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
        </div>
      </section>

      <footer className="footer">
        <div className="container footer__content">
          <div className="brand-lockup brand-lockup--footer">
            <img
              className="brand-logo brand-logo--footer"
              src="/ink-revenue-logo.svg"
              alt="Ink Revenue logotyp"
            />
            <div className="brand-mark brand-mark--footer">Ink Revenue</div>
          </div>
          <p>Kontakta oss på: +46732009483</p>
          <p>Mejl: info@inkrevenue.se</p>
          <div className="socials">
            <a
              className="social"
              href="https://www.facebook.com/profile.php?id=61561471121202"
              aria-label="Facebook"
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M15 8h3V5h-3c-2 0-4 1.5-4 4v2H8v3h3v5h3v-5h3l1-3h-4V9c0-.6.4-1 1-1z"
                  fill="currentColor"
                />
              </svg>
            </a>
            <a
              className="social"
              href="https://www.instagram.com/ink_revenue/"
              aria-label="Instagram"
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm5.2-3.1a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
                  fill="currentColor"
                />
              </svg>
            </a>
          </div>
          <p className="footer__copy">Copyright 2026. Ink Revenue. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
