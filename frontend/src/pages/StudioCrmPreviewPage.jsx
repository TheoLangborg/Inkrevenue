import { useEffect, useMemo, useState } from "react";
import { getPublicStudioBySlug } from "../services/publicSiteApi";
import { StudioProfilePage } from "./StudioProfilePage";

const READY_MESSAGE_TYPE = "inkrevenue-crm-preview:ready";
const UPDATE_MESSAGE_TYPE = "inkrevenue-crm-preview:update";

function getParentOrigin() {
  if (typeof document === "undefined" || !document.referrer) {
    return "";
  }

  try {
    return new URL(document.referrer).origin;
  } catch {
    return "";
  }
}

function getPreviewSlug() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("slug") || "";
}

export function StudioCrmPreviewPage() {
  const [studio, setStudio] = useState(null);
  const parentOrigin = useMemo(() => getParentOrigin(), []);
  const previewSlug = useMemo(() => getPreviewSlug(), []);

  useEffect(() => {
    function handleMessage(event) {
      if (parentOrigin && event.origin !== parentOrigin) {
        return;
      }

      if (event.data?.type !== UPDATE_MESSAGE_TYPE) {
        return;
      }

      setStudio(event.data.payload || null);
    }

    window.addEventListener("message", handleMessage);

    if (window.parent && window.parent !== window) {
      function sendReady() {
        window.parent.postMessage({ type: READY_MESSAGE_TYPE }, parentOrigin || "*");
      }

      // Send immediately, then retry a few times to handle race conditions
      // where the parent's message listener hasn't mounted yet.
      sendReady();
      const t1 = setTimeout(sendReady, 200);
      const t2 = setTimeout(sendReady, 800);

      return () => {
        window.removeEventListener("message", handleMessage);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    return () => window.removeEventListener("message", handleMessage);
  }, [parentOrigin]);

  useEffect(() => {
    if (!previewSlug || studio) {
      return undefined;
    }

    let active = true;

    getPublicStudioBySlug(previewSlug)
      .then((response) => {
        if (active) {
          setStudio({
            ...response,
            previewMessage: `Sparad publik sida för ${response.name || "studion"}. När previewn är inbäddad i CRM uppdateras den live medan du skriver.`
          });
        }
      })
      .catch(() => {
        if (active) {
          setStudio(null);
        }
      });

    return () => {
      active = false;
    };
  }, [previewSlug, studio]);

  if (!studio) {
    return (
      <section className="section section--white">
        <div className="container">
          <div className="loading-state">Väntar på live preview från CRM...</div>
        </div>
      </section>
    );
  }

  return <StudioProfilePage studioOverride={studio} previewMode />;
}
