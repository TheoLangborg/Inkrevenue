import { buildPageTitle, useJsonLd, usePageMetadata } from "../utils/pageMetadata";
import { SiteLink } from "../utils/siteRouter";

const FAQ_ITEMS = [
  {
    q: "Behöver vi sköta något själva?",
    a: "Nej. Ni godkänner material och svarar på frågor från oss — det är allt. Vi sköter annonsering, innehåll, kundkontakt och uppföljning. Ju mer ni delar med er om er stil och era preferenser, desto bättre resultat."
  },
  {
    q: "Hur snabbt ser vi resultat?",
    a: "De flesta studios ser de första förfrågningarna inom 1–2 veckor efter uppstart. Volym och kvalitet ökar löpande de första 60–90 dagarna allteftersom vi optimerar era kanaler."
  },
  {
    q: "Vad är skillnaden mot att sköta Instagram eller Google själv?",
    a: "Att sköta marknadsföringen själv tar tid, kräver kunskap och ger ofta ojämna resultat. Vi är specialiserade på tatueringsmarknaden — vi vet vad som fungerar, kör det konsekvent och rapporterar resultaten. Ni betalar för en hel marknadsföringsavdelning till en bråkdel av kostnaden."
  },
  {
    q: "Hur ser vår studio-sida ut?",
    a: "Varje studio får en skräddarsydd sida med er logotyp, galleri, stil-taggar, om-oss-text och ett anpassat förfrågningsformulär. Kunder kan filtrera på stil, stad och känsla — och skicka en förfrågan med sin idé och budget direkt."
  },
  {
    q: "Vad händer om vi vill avsluta?",
    a: "Ni kan avsluta månad för månad utan förklaring. Ni äger alltid er data, era bilder och era sociala medier-kanaler. Vi hjälper till med överlämning om ni önskar."
  },
  {
    q: "Fungerar det för soloartister också?",
    a: "Absolut. Ink Revenue passar lika bra för soloartister som för studios med flera konstnärer. Vi anpassar upplägg och budget efter er situation."
  },
  {
    q: "Vad kostar det?",
    a: "Vi arbetar med månadsabonnemang utan bindningstid. Priset anpassas efter studio-storlek och vilka kanaler vi kör. Boka ett gratis strategisamtal så går vi igenom vad som passar er bäst."
  },
  {
    q: "Hur kommer kunderna i kontakt med oss via Ink Revenue?",
    a: "Kunder hittar er studio via vår katalog, söker på stil och stad, läser om er och skickar en förfrågan direkt via formuläret på er studio-sida. Förfrågan hamnar hos er — ni svarar och bokar som vanligt."
  },
  {
    q: "Kan vi se hur många förfrågningar vi får?",
    a: "Ja. Ni har tillgång till er dashboard i CRM-systemet där ni ser alla leads, förfrågningar och statistik i realtid."
  }
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQ_ITEMS.map(({ q, a }) => ({
    "@type": "Question",
    "name": q,
    "acceptedAnswer": { "@type": "Answer", "text": a }
  }))
};

export function FaqPage() {
  usePageMetadata({
    title: buildPageTitle("Vanliga frågor om Ink Revenue"),
    description:
      "Svar på vanliga frågor om Ink Revenue — hur tjänsten fungerar, vad det kostar, hur snabbt ni ser resultat och vad som händer om ni vill avsluta.",
    path: "/faq"
  });

  useJsonLd(faqJsonLd);

  return (
    <div>
      <section className="page-hero page-hero--directory">
        <div className="container">
          <p className="eyebrow">Vanliga frågor</p>
          <h1>Svar på det ni undrar</h1>
          <p className="lead lead--dark">
            Allt ni behöver veta om hur Ink Revenue fungerar — innan ni bokar ett samtal.
          </p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container" style={{ maxWidth: 800 }}>
          <dl className="faq-page__list">
            {FAQ_ITEMS.map(({ q, a }) => (
              <div key={q} className="faq-page__item">
                <dt className="faq-page__q">{q}</dt>
                <dd className="faq-page__a">{a}</dd>
              </div>
            ))}
          </dl>

          <div className="faq-page__cta">
            <p>Hittade du inte svar på din fråga?</p>
            <SiteLink className="btn btn-primary" href="/#bokning">
              Boka ett gratis strategisamtal
            </SiteLink>
          </div>
        </div>
      </section>
    </div>
  );
}
