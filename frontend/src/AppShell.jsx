import { LegalConsentProvider, useLegalConsent } from "./contexts/LegalConsentContext";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { createDemoStudioPreview } from "./data/demoStudio";
import { FaqPage } from "./pages/FaqPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { StudioCrmPreviewPage } from "./pages/StudioCrmPreviewPage";
import { StudioProfilePage } from "./pages/StudioProfilePage";
import { StudiosDirectoryPage } from "./pages/StudiosDirectoryPage";
import { studioRegistry } from "./pages/studios";
import { ThemedStudioPage } from "./pages/studios/ThemedStudioPage";
import { useSiteLocation } from "./utils/siteRouter";

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

  if (pathname === "/studio-crm-preview") {
    return {
      currentPath: "/studios",
      element: <StudioCrmPreviewPage />
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
          studioOverride={createDemoStudioPreview({ submitSlug })}
        />
      )
    };
  }

  const studioMatch = pathname.match(/^\/studio\/([^/]+)$/);

  if (studioMatch) {
    const slug = decodeURIComponent(studioMatch[1]);
    const entry = studioRegistry[slug];
    return {
      currentPath: pathname,
      element: entry
        ? <ThemedStudioPage slug={slug} theme={entry.theme} />
        : <StudioProfilePage slug={slug} />
    };
  }

  return {
    currentPath: pathname,
    element: <NotFoundPage />
  };
}

function AppContent() {
  const location = useSiteLocation();
  const page = getPageFromPath(location.pathname);
  const { openLegalModal } = useLegalConsent();

  return (
    <div>
      <SiteHeader currentPath={page.currentPath} />
      <main>{page.element}</main>
      <SiteFooter onOpenLegalModal={openLegalModal} />
    </div>
  );
}

export default function App() {
  return (
    <LegalConsentProvider>
      <AppContent />
    </LegalConsentProvider>
  );
}
