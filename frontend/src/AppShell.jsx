import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { createDemoStudioPreview } from "./data/demoStudio";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { StudioProfilePage } from "./pages/StudioProfilePage";
import { StudiosDirectoryPage } from "./pages/StudiosDirectoryPage";
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
    return {
      currentPath: pathname,
      element: <StudioProfilePage slug={decodeURIComponent(studioMatch[1])} />
    };
  }

  return {
    currentPath: pathname,
    element: <NotFoundPage />
  };
}

export default function App() {
  const location = useSiteLocation();
  const page = getPageFromPath(location.pathname);

  return (
    <div>
      <SiteHeader currentPath={page.currentPath} />
      <main>{page.element}</main>
      <SiteFooter />
    </div>
  );
}
