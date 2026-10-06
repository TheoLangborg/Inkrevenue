import { LegalConsentProvider } from "./contexts/LegalConsentContext";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { createDemoStudioPreview } from "./data/demoStudio";
import { FaqPage } from "./pages/FaqPage";
import { HomePage } from "./pages/HomePage";
import { LegalPage } from "./pages/LegalPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { StudioCrmPreviewPage } from "./pages/StudioCrmPreviewPage";
import { StudioProfilePage } from "./pages/StudioProfilePage";
import { StudiosDirectoryPage } from "./pages/StudiosDirectoryPage";
import { SlotOfferPage } from "./pages/SlotOfferPage";
import { PaymentLinkPage } from "./pages/PaymentLinkPage";
import { TrialPage } from "./pages/TrialPage";
import { studioRegistry } from "./pages/studios";
import { ThemedStudioPage } from "./pages/studios/ThemedStudioPage";
import { useSiteLocation } from "./utils/siteRouter";
import { useScrollReveal } from "./utils/useScrollReveal";
import { useStudioVisitTracking } from "./utils/useStudioVisitTracking";
import { useBookingFormAutoScroll } from "./utils/useBookingFormAutoScroll";
import { LanguageProvider } from "./i18n/LanguageContext";
import { splitLanguageFromPath } from "./i18n/config";

function getPageFromPath(pathname) {
  if (pathname === "/") {
    return {
      currentPath: pathname,
      element: <HomePage />
    };
  }

  if (pathname === "/studios") {
    return {
      currentPath: pathname,
      element: <StudiosDirectoryPage />
    };
  }

  if (pathname === "/faq") {
    return {
      currentPath: pathname,
      element: <FaqPage />
    };
  }

  // Fokuserad landningssida för trial-trafik (Instagram-bio m.m.) —
  // headern döljs så att sidans enda CTA inte konkurrerar med navigationen.
  if (pathname === "/testa-gratis") {
    return {
      currentPath: pathname,
      element: <TrialPage />,
      hideHeader: true
    };
  }

  // Egna rutter, inte bara modalen: Googles OAuth-verifiering kräver att
  // integritetspolicyn går att öppna direkt på sin URL.
  if (pathname === "/integritetspolicy") {
    return {
      currentPath: pathname,
      element: <LegalPage document="privacy" />
    };
  }

  if (pathname === "/anvandarvillkor") {
    return {
      currentPath: pathname,
      element: <LegalPage document="terms" />
    };
  }

  if (pathname === "/studio-crm-preview") {
    return {
      currentPath: "/studios",
      element: <StudioCrmPreviewPage />
    };
  }

  // Erbjudande om en ledig tid, från SMS-länk. Header och footer döljs — den
  // som öppnar länken står med mobilen och ska bara svara ja eller nej, inte
  // navigera runt på sajten.
  const slotOfferMatch = pathname.match(/^\/tid\/([^/]+)$/);

  if (slotOfferMatch) {
    return {
      currentPath: pathname,
      element: <SlotOfferPage token={decodeURIComponent(slotOfferMatch[1])} />,
      hideHeader: true,
      hideFooter: true
    };
  }

  // Betallänk för en bokad tid, från mejl eller SMS. Samma upplägg som
  // erbjudandesidan: ingen header eller footer, sidans enda syfte är att betala.
  const paymentLinkMatch = pathname.match(/^\/betala\/([^/]+)$/);

  if (paymentLinkMatch) {
    return {
      currentPath: pathname,
      element: <PaymentLinkPage token={decodeURIComponent(paymentLinkMatch[1])} />,
      hideHeader: true,
      hideFooter: true
    };
  }

  const studioPreviewMatch = pathname.match(/^\/studio-preview(?:\/([^/]+))?$/);

  if (studioPreviewMatch) {
    const submitSlug = studioPreviewMatch[1] ? decodeURIComponent(studioPreviewMatch[1]) : "";

    return {
      currentPath: "/studios",
      element: (
        <StudioProfilePage
          previewMode
          // Den här vägen är den avsiktliga end-to-end-testen: utan slug är
          // formuläret ändå dött, med slug ska det skapa ett riktigt lead.
          allowPreviewSubmit
          studioOverride={createDemoStudioPreview({ submitSlug })}
        />
      )
    };
  }

  const studioMatch = pathname.match(/^\/studio\/([^/]+)$/);

  if (studioMatch) {
    const slug = decodeURIComponent(studioMatch[1]);
    const entry = studioRegistry[slug];
    // En studio med egen sidkomponent (t.ex. GhostInkPage) går före temat.
    const CustomStudioPage = entry?.page;
    return {
      currentPath: pathname,
      // Slugen ligger på sidan så att besöksmätningen kan ske på ett ställe —
      // alla studiosidor nedan går genom den här rutten.
      studioSlug: slug,
      // Alla tre ligger i InkRevenues ram: sidhuvud och sidfot ritas nedan.
      element: CustomStudioPage
        ? <CustomStudioPage slug={slug} />
        : entry
          ? <ThemedStudioPage slug={slug} theme={entry.theme} />
          : <StudioProfilePage slug={slug} />
    };
  }

  return {
    currentPath: pathname,
    element: <NotFoundPage />
  };
}

function AppContent({ page }) {
  useScrollReveal();
  useStudioVisitTracking(page.studioSlug);
  useBookingFormAutoScroll(page.studioSlug);

  return (
    <div>
      {!page.hideHeader && <SiteHeader currentPath={page.currentPath} />}
      <main>{page.element}</main>
      {!page.hideFooter && <SiteFooter />}
    </div>
  );
}

export default function App() {
  const location = useSiteLocation();
  // Språket ligger som prefix i URL:en ("/en/studios"). Resten av appen ser
  // bara den språkfria sökvägen, så rutterna finns bara i en uppsättning.
  const { language, path } = splitLanguageFromPath(location.pathname);
  const page = getPageFromPath(path);

  return (
    <LanguageProvider language={language} path={path}>
      <LegalConsentProvider>
        <AppContent page={page} />
      </LegalConsentProvider>
    </LanguageProvider>
  );
}
