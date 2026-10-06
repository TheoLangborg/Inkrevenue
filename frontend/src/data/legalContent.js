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
 * Den svenska versionen är den juridiskt bindande. Den engelska är en
 * översättning, och sidan säger det (legal.translationNotice). Ändras en
 * mening på svenska ska den engelska ändras i samma veva.
 */

export const LEGAL_DOCUMENTS = {
  privacy: {
    slug: "integritetspolicy",
    path: "/integritetspolicy",
    eyebrow: "Integritetspolicy",
    title: "Så använder vi dina uppgifter",
    lead:
      "Den här policyn beskriver vilka uppgifter Ink Revenue samlar in, varför vi gör det och hur du får dem borttagna.",
    updated: "2026-07-21",
    groups: [
      {
        heading: "Uppgifter du lämnar i våra formulär",
        paragraphs: [
          "När du fyller i namn, mejl, telefon eller bokningsdetaljer sparar vi uppgifterna för att hantera din förfrågan och hjälpa dig vidare till rätt studio eller strategisamtal.",
          "Om du börjar fylla i ett formulär men inte skickar in det kan vi spara utkastet och skicka påminnelser via mejl eller sms under veckan, så att du enkelt kan fortsätta där du slutade.",
          "Vi använder också teknisk information som sida, referenslänk och kampanjdata för att förstå var förfrågningar kommer ifrån och förbättra tjänsten."
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
          "Du har rätt att få veta vilka uppgifter vi har om dig, få felaktiga uppgifter rättade och få uppgifter raderade.",
          "Kontakta oss på info@inkrevenue.online så hanterar vi din begäran. Vi svarar normalt inom 30 dagar."
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
    updated: "2026-07-21",
    groups: [
      {
        heading: "Tjänsten",
        paragraphs: [
          "Tjänsten används för att skicka bokningsförfrågningar, hitta studios och boka strategisamtal. Uppgifter du lämnar ska vara korrekta och relevanta för din förfrågan.",
          "Ink Revenue och anslutna studios får använda uppgifterna för att kontakta dig om din bokning, följa upp ett påbörjat formulär och ge återkoppling på din förfrågan."
        ]
      },
      {
        heading: "Ditt samtycke",
        paragraphs: [
          "Genom att använda formulären godkänner du att vi sparar det som behövs för att kunna leverera tjänsten och följa upp din kontakt.",
          "Om du inte längre vill bli kontaktad kan du meddela oss eller den studio du varit i kontakt med."
        ]
      },
      {
        heading: "För anslutna studios",
        paragraphs: [
          "Studios ansvarar för att uppgifter som läggs in i CRM:et hanteras enligt gällande dataskyddsregler, och för att inhämta samtycke från sina egna kunder där det krävs.",
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
    lead:
      "This policy describes what information Ink Revenue collects, why we collect it and how you can have it deleted.",
    groups: [
      {
        heading: "Information you provide in our forms",
        paragraphs: [
          "When you enter your name, email, phone number or booking details, we store that information to handle your enquiry and to help you on to the right studio or strategy call.",
          "If you start filling in a form but don't submit it, we may save the draft and send you reminders by email or text message during the week, so that you can easily pick up where you left off.",
          "We also use technical information such as the page, the referring link and campaign data to understand where enquiries come from and to improve the service."
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
          "You have the right to know what information we hold about you, to have incorrect information corrected and to have your information deleted.",
          "Contact us at info@inkrevenue.online and we will handle your request. We normally reply within 30 days."
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
          "The service is used to send booking enquiries, find studios and book strategy calls. The information you provide must be accurate and relevant to your enquiry.",
          "Ink Revenue and affiliated studios may use the information to contact you about your booking, follow up on a form you have started and respond to your enquiry."
        ]
      },
      {
        heading: "Your consent",
        paragraphs: [
          "By using the forms, you agree that we store what is needed to provide the service and to follow up on your contact with us.",
          "If you no longer want to be contacted, you can tell us or the studio you have been in contact with."
        ]
      },
      {
        heading: "For affiliated studios",
        paragraphs: [
          "Studios are responsible for ensuring that information entered into the CRM is handled in accordance with applicable data protection rules, and for obtaining consent from their own customers where required.",
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
