import { useEffect, useState } from "react";
import { PublicStudioCard } from "../components/PublicStudioCard";
import { StrategyCallForm } from "../components/StrategyCallForm";
import { getPublicStudios } from "../services/publicSiteApi";
import { buildPageTitle, usePageMetadata } from "../utils/pageMetadata";
import { SiteLink } from "../utils/siteRouter";

export function HomePage() {
  const [featuredStudios, setFeaturedStudios] = useState([]);
  const [loadingStudios, setLoadingStudios] = useState(true);

  usePageMetadata({
    title: buildPageTitle("För studioägare och tatueringskunder"),
    description:
      "Ink Revenue hjälper tatueringsstudior att synas bättre och få fler relevanta förfrågningar, samtidigt som kunder enklare hittar rätt studio för sin idé.",
    path: "/"
  });

  useEffect(() => {
    let active = true;

    getPublicStudios()
      .then((studios) => {
        if (active) {
          setFeaturedStudios(studios.slice(0, 3));
        }
      })
      .catch(() => {
        if (active) {
          setFeaturedStudios([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingStudios(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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

          <h1>Vi hjälper tatueringsstudior att få fler rätt kunder och kunder att hitta rätt tatuerare.</h1>
          <p className="lead">
            Ink Revenue hjälper studior att synas bättre, ta emot fler relevanta förfrågningar och
            bygga en tydlig digital närvaro. För kunder innebär det att det blir enklare att hitta
            en studio som passar stil, plats och känsla.
          </p>

          <div className="cta-row">
            <SiteLink className="btn btn-primary" href="#bokning">
              Boka ett strategisamtal
            </SiteLink>
            <SiteLink className="btn btn-secondary btn-secondary--hero" href="/studios">
              <span>Utforska studios</span>
              <svg className="btn__icon" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M4 10h12M10 5l5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </SiteLink>
          </div>

          <div className="audience-grid">
            <article className="audience-card audience-card--customer">
              <p className="audience-card__eyebrow">För kunder</p>
              <h3>Hitta en studio efter stil, stad och känsla</h3>
              <p>
                Utforska studiosidor, galleri och uttryck innan du skickar en förfrågan.
              </p>
              <SiteLink className="btn btn-primary" href="/studios">
                Hitta studio
              </SiteLink>
            </article>

            <article className="audience-card audience-card--studio">
              <p className="audience-card__eyebrow">För studioägare</p>
              <h3>Få fler rätt förfrågningar och en tydligare digital närvaro</h3>
              <p>
                Se hur vi hjälper studior att bli lättare att hitta och enklare att välja.
              </p>
              <SiteLink className="btn btn-secondary btn-secondary--light" href="#for-studios">
                Se hur vi hjälper studior
              </SiteLink>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--white" id="for-studios">
        <div className="container grid-2">
          <div>
            <p className="eyebrow">För Studior</p>
            <h2>Få fler förfrågningar med en studiosida som faktiskt säljer in er</h2>
            <p className="body">
              Vi hjälper er att presentera studio, stil och uttryck på ett sätt som gör det lätt
              för rätt kunder att välja just er.
            </p>
            <p className="body">
              Ni får en tydlig väg från sociala medier och annonser till en sida där kunder kan
              läsa på, känna förtroende och skicka en förfrågan.
            </p>
          </div>

          <div className="card-grid card-grid--single">
            <div className="card">
              <div className="card__icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path d="M16 18h32v8H16zM16 30h22v8H16zM16 42h18v8H16z" fill="currentColor" />
                </svg>
              </div>
              <h3>1. Bli lättare att hitta</h3>
              <p>Vi hjälper er att synas där kunder redan letar efter sin nästa tatuering.</p>
            </div>
            <div className="card">
              <div className="card__icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <rect
                    x="10"
                    y="12"
                    width="44"
                    height="40"
                    rx="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path d="M22 24h20M22 34h20M22 44h12" stroke="currentColor" strokeWidth="4" />
                </svg>
              </div>
              <h3>2. Visa vad som gör er unika</h3>
              <p>Er studiosida lyfter stil, känsla, bilder och info så att rätt kunder känner igen sig direkt.</p>
            </div>
            <div className="card">
              <div className="card__icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path
                    d="M20 20h24v24H20z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path d="M18 18l28 28" stroke="currentColor" strokeWidth="4" />
                </svg>
              </div>
              <h3>3. Få in bättre förfrågningar</h3>
              <p>Kunder kan beskriva idé, placering och önskemål från start så att ni får bättre underlag.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--lavender" id="for-customers">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">För Kunder</p>
              <h2>Hitta studios som matchar din stil och känsla</h2>
            </div>
            <SiteLink className="btn btn-secondary" href="/studios">
              Se alla studios
            </SiteLink>
          </div>

          {loadingStudios ? (
            <div className="loading-state">Laddar studios...</div>
          ) : featuredStudios.length ? (
            <div className="studio-grid">
              {featuredStudios.map((studio) => (
                <PublicStudioCard key={studio.id} studio={studio} compact />
              ))}
            </div>
          ) : (
            <div className="empty-panel">
              <h3>Fler studios kommer snart</h3>
              <p>
                Vi fyller på katalogen löpande. Kom tillbaka snart för att upptäcka fler studios
                och tatuerare.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="section section--blue">
        <div className="container">
          <div className="section-title">
            <div className="line"></div>
            <h2>Varför Ink Revenue Fungerar</h2>
            <div className="line"></div>
          </div>

          <div className="card-grid">
            <div className="card">
              <div className="card__icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path
                    d="M16 32c0-8.8 7.2-16 16-16s16 7.2 16 16-7.2 16-16 16S16 40.8 16 32z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path d="M32 22v12l8 4" stroke="currentColor" strokeWidth="4" />
                </svg>
              </div>
              <h3>Snabb väg från inspiration till kontakt</h3>
              <p>
                En bra studiosida gör det enkelt att gå från "jag funderar" till "jag vill boka".
              </p>
            </div>

            <div className="card">
              <div className="card__icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path
                    d="M12 18h40v28H12z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path d="M20 28h24M20 36h18" stroke="currentColor" strokeWidth="4" />
                </svg>
              </div>
              <h3>Bättre matchning från start</h3>
              <p>
                När kunder ser stil, plats och uttryck tydligt blir det lättare att hitta rätt
                studio direkt.
              </p>
            </div>

            <div className="card">
              <div className="card__icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path
                    d="M14 46l12-12 8 8 16-18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Mer synlighet för rätt studios</h3>
              <p>
                Vi bygger en plattform där seriösa studios kan presentera sig professionellt och
                växa över tid.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--lavender" id="bokning">
        <div className="container booking">
          <div>
            <p className="eyebrow">För Studioägare</p>
            <h2>Vill ni få fler relevanta kundförfrågningar?</h2>
            <p className="body">
              Boka ett första samtal med Ink Revenue så går vi igenom era mål, vilken typ av kunder
              ni vill nå och hur vi kan hjälpa er att få ett jämnare inflöde av relevanta
              förfrågningar.
            </p>
          </div>

          <StrategyCallForm />
        </div>
      </section>
    </div>
  );
}
