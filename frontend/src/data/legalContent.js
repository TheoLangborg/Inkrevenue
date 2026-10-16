/**
 * Enda källan för integritetspolicy och användarvillkor.
 *
 * Samma innehåll renderas på två ställen: i modalen (LegalDocumentModal) och på
 * de publika sidorna /integritetspolicy och /anvandarvillkor. Sidorna finns för
 * att Googles OAuth-verifiering kräver en direktlänkbar URL utan inloggning —
 * en modal går inte att skicka in som policylänk.
 *
 * Google-avsnittet i integritetspolicyn granskas av Googles OAuth-team. Ändras
 * kalenderintegrationen i tattoo-crm måste texten uppdateras i samma veva,
 * annars stämmer inte policyn med vad appen faktiskt gör.
 *
 * Policyn innehåller bara det GDPR art. 13 och LEK kräver. Lägg inte till
 * förklaringar som inte behövs juridiskt.
 *
 * ⚠️ Lagringstiderna i policyn verkställs av gallringen i tattoo-crm
 * (backend/src/services/personalDataRetentionService.js, och väntelistans i
 * slotRecoveryRetentionService.js). Ändras en siffra på ena stället måste den
 * ändras på det andra. Underbiträdena ska stämma med biträdesavtalet.
 *
 * Den svenska versionen är den juridiskt bindande. Den engelska är en
 * översättning, och sidan säger det (legal.translationNotice). Ändras en
 * mening på svenska ska den engelska ändras i samma veva.
 *
 * En grupp har `paragraphs` och kan ha `items` (punktlista efter styckena).
 */

import { SITE_OPERATOR, SITE_OPERATOR_ADDRESS } from "./siteOperator";

export const LEGAL_DOCUMENTS = {
  privacy: {
    slug: "integritetspolicy",
    path: "/integritetspolicy",
    eyebrow: "Integritetspolicy",
    title: "Så använder vi dina uppgifter",
    lead: "Vilka personuppgifter Ink Revenue behandlar, varför, hur länge och vilka rättigheter du har.",
    updated: "2026-10-16",
    groups: [
      {
        heading: "Personuppgiftsansvarig",
        paragraphs: [
          `Ink Revenue drivs av ${SITE_OPERATOR.name}, enskild firma, ${SITE_OPERATOR_ADDRESS}, ${SITE_OPERATOR.email}.`,
          "För bokningsförfrågningar till en studio är studion personuppgiftsansvarig och Ink Revenue behandlar uppgifterna för studions räkning."
        ]
      },
      {
        heading: "Vad vi behandlar, varför och hur länge",
        paragraphs: [],
        items: [
          "Bokningsförfrågan (namn, kontaktuppgifter, beskrivning och bilder): för att studion ska kunna svara och boka in dig. Grund: åtgärder före avtal. Utan kontaktuppgifter kan studion inte svara. Raderas 12 månader efter senaste kontakten om det inte blir någon bokning eller betalning. Bokningar och betalningar sparas så länge kundrelationen kräver det.",
          "Utkast: det du skriver sparas medan du skriver, så att förfrågan eller en betalning inte går förlorad. Grund: berättigat intresse. Tas bort 14 dagar efter senaste aktivitet, eller efter 12 månader om du betalat utan att skicka in.",
          "Påminnelser om formulär du inte skickat in (högst tre): grund samtycke, som du återkallar med länken i påminnelsen.",
          "Sms om lediga tider från en studios väntelista: grund samtycke, som gäller i 12 månader. Avregistrera dig med länken i varje sms.",
          "Strategisamtal och förfrågningar från företag: för att svara och ge ett erbjudande. Grund: åtgärder före avtal och berättigat intresse av att följa upp förfrågan. Raderas 24 månader efter senaste kontakten om det inte blir någon affär.",
          "Studiokonton: för att leverera tjänsten och fakturera. Grund: avtal och bokföringslagen. Fakturor och underlag sparas i sju år.",
          "Var förfrågan kom ifrån (sida, hänvisande länk, kampanj): för att visa studion källan och räkna ut provisionen. Grund: berättigat intresse. Sparas lika länge som förfrågan."
        ]
      },
      {
        heading: "Cookies och lagring i webbläsaren",
        paragraphs: [
          "Sajten sätter inga egna cookies. I webbläsarens lagring sparas ditt språkval och, tills du stänger fliken, ett sessions-id för besöksräkning och id:t för ditt utkast. På studiosidor med betalning sätter Stripe cookies för att förhindra bedrägerier."
        ]
      },
      {
        heading: "Mottagare",
        paragraphs: [
          "Studion du skickar förfrågan till, och leverantörer som behandlar uppgifter åt oss: Google Cloud och Firebase (databas och filer), Railway och Vercel (drift), Resend (e-post), 46elks (sms), Stripe (betalningar), Sentry (felrapporter) och Google Fonts (typsnitt)."
        ]
      },
      {
        heading: "Överföring utanför EU",
        paragraphs: [
          "Flera leverantörer är amerikanska. Överföringen skyddas av EU–US Data Privacy Framework eller EU-kommissionens standardavtalsklausuler."
        ]
      },
      {
        // Den fullständiga kalendertexten bor i CRM:et
        // (tattoo-crm/frontend/src/components/site/siteInfoContent.js), eftersom
        // det är den URL Google Cloud Console pekar på vid OAuth-verifieringen.
        // Här står bara en sammanfattning — annars finns två juridiska texter om
        // samma integration som glider isär.
        heading: "Kalenderkoppling för anslutna studios",
        paragraphs: [
          "Studios som använder vårt CRM kan frivilligt koppla sin kalender från Google, Apple eller Outlook. Vi läser titel och tid på kommande händelser enbart för att se när studion är upptagen, och skriver in bokningar som görs i CRM:et. Kalenderdata säljs aldrig, används aldrig för annonsering och delas inte med tredje part.",
          "Fullständig beskrivning av kalenderkopplingen finns i CRM:ets integritetspolicy på inkrevenue-crm.online/integritet."
        ]
      },
      {
        heading: "Dina rättigheter",
        paragraphs: [
          `Du har rätt till tillgång, rättelse, radering, begränsning och dataportabilitet, rätt att invända mot behandling som bygger på berättigat intresse och rätt att när som helst återkalla ett samtycke. Kontakta oss på ${SITE_OPERATOR.email}, så svarar vi inom 72 timmar.`,
          "Du kan klaga hos Integritetsskyddsmyndigheten (IMY), imy.se."
        ]
      }
    ]
  },
  terms: {
    slug: "anvandarvillkor",
    path: "/anvandarvillkor",
    eyebrow: "Användarvillkor",
    title: "Villkor för att använda Ink Revenue",
    lead: "Villkoren gäller när du använder våra formulär, vår studio-katalog eller vårt CRM.",
    updated: "2026-10-16",
    groups: [
      {
        heading: "Tjänsten",
        paragraphs: [
          "Tjänsten används för att skicka bokningsförfrågningar, hitta studios och boka strategisamtal. Uppgifter du lämnar ska vara korrekta.",
          "Ink Revenue och anslutna studios får kontakta dig om din förfrågan och din bokning."
        ]
      },
      {
        heading: "För anslutna studios",
        paragraphs: [
          "Studios ansvarar för att uppgifter som läggs in i CRM:et hanteras enligt dataskyddsreglerna och för att inhämta samtycke från sina kunder där det krävs.",
          "Kopplar studion en extern kalender ansvarar den för att kopplingen får göras för det konto som används."
        ]
      }
    ]
  }
};

// Samma adresser, datum och ordning som de svenska dokumenten.
const LEGAL_DOCUMENTS_EN = {
  privacy: {
    ...LEGAL_DOCUMENTS.privacy,
    eyebrow: "Privacy policy",
    title: "How we use your information",
    lead: "What personal data Ink Revenue processes, why, for how long and what rights you have.",
    groups: [
      {
        heading: "Data controller",
        paragraphs: [
          `Ink Revenue is run by ${SITE_OPERATOR.name}, sole trader, ${SITE_OPERATOR_ADDRESS}, Sweden, ${SITE_OPERATOR.email}.`,
          "For booking enquiries to a studio, the studio is the data controller and Ink Revenue processes the data on the studio's behalf."
        ]
      },
      {
        heading: "What we process, why and for how long",
        paragraphs: [],
        items: [
          "Booking enquiry (name, contact details, description and images): so that the studio can reply and book you in. Basis: steps prior to a contract. Without contact details the studio cannot reply. Deleted 12 months after the last contact if no booking or payment is made. Bookings and payments are kept for as long as the customer relationship requires.",
          "Drafts: what you type is saved as you type, so that the enquiry or a payment isn't lost. Basis: legitimate interest. Removed 14 days after the last activity, or after 12 months if you paid without submitting.",
          "Reminders about forms you haven't submitted (at most three): basis consent, which you withdraw with the link in the reminder.",
          "Text messages about free time slots from a studio's waiting list: basis consent, valid for 12 months. Unsubscribe with the link in every message.",
          "Strategy calls and enquiries from businesses: to reply and make an offer. Basis: steps prior to a contract and legitimate interest in following up the enquiry. Deleted 24 months after the last contact if no deal is made.",
          "Studio accounts: to deliver the service and invoice. Basis: contract and the Swedish Bookkeeping Act. Invoices and records are kept for seven years.",
          "Where the enquiry came from (page, referring link, campaign): to show the studio the source and calculate the commission. Basis: legitimate interest. Kept as long as the enquiry."
        ]
      },
      {
        heading: "Cookies and browser storage",
        paragraphs: [
          "The site sets no cookies of its own. Your browser's storage holds your language choice and, until you close the tab, a session ID for counting visits and the ID of your draft. On studio pages that take payments, Stripe sets cookies to prevent fraud."
        ]
      },
      {
        heading: "Recipients",
        paragraphs: [
          "The studio you send the enquiry to, and suppliers that process data on our behalf: Google Cloud and Firebase (database and files), Railway and Vercel (hosting), Resend (email), 46elks (text messages), Stripe (payments), Sentry (error reports) and Google Fonts (fonts)."
        ]
      },
      {
        heading: "Transfers outside the EU",
        paragraphs: [
          "Several suppliers are US companies. Transfers are protected by the EU–US Data Privacy Framework or the European Commission's standard contractual clauses."
        ]
      },
      {
        heading: "Calendar connection for affiliated studios",
        paragraphs: [
          "Studios that use our CRM can choose to connect their calendar from Google, Apple or Outlook. We read the title and time of upcoming events solely to see when the studio is busy, and we add bookings made in the CRM to the calendar. Calendar data is never sold, never used for advertising and never shared with third parties.",
          "A full description of the calendar connection is available in the CRM's privacy policy at inkrevenue-crm.online/integritet."
        ]
      },
      {
        heading: "Your rights",
        paragraphs: [
          `You have the right of access, rectification, erasure, restriction and data portability, the right to object to processing based on legitimate interest and the right to withdraw a consent at any time. Contact us at ${SITE_OPERATOR.email} and we will reply within 72 hours.`,
          "You can lodge a complaint with the Swedish Authority for Privacy Protection (IMY), imy.se."
        ]
      }
    ]
  },
  terms: {
    ...LEGAL_DOCUMENTS.terms,
    eyebrow: "Terms of use",
    title: "Terms for using Ink Revenue",
    lead: "These terms apply when you use our forms, our studio directory or our CRM.",
    groups: [
      {
        heading: "The service",
        paragraphs: [
          "The service is used to send booking enquiries, find studios and book strategy calls. The information you provide must be accurate.",
          "Ink Revenue and affiliated studios may contact you about your enquiry and your booking."
        ]
      },
      {
        heading: "For affiliated studios",
        paragraphs: [
          "Studios are responsible for handling information entered into the CRM in accordance with data protection rules and for obtaining consent from their customers where required.",
          "A studio that connects an external calendar is responsible for making sure it is allowed to connect the account it uses."
        ]
      }
    ]
  }
};

/** Dokumenten på sidans språk. Saknas språket gäller de svenska. */
export function getLegalDocuments(language) {
  return language === "en" ? LEGAL_DOCUMENTS_EN : LEGAL_DOCUMENTS;
}

export const LEGAL_PATHS = Object.fromEntries(
  Object.entries(LEGAL_DOCUMENTS).map(([key, doc]) => [key, doc.path])
);
