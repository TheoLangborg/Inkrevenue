import { useEffect, useMemo, useRef, useState } from "react";
import {
  savePublicStudioLeadDraft,
  saveStrategyCallDraft
} from "../services/publicSiteApi";
import { getTrackingPayload } from "../utils/tracking";
import { useLanguage } from "../i18n/LanguageContext";

function readStoredDraftId(storageKey) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem(storageKey) || "";
}

function writeStoredDraftId(storageKey, draftId) {
  if (typeof window === "undefined") {
    return;
  }

  if (draftId) {
    window.sessionStorage.setItem(storageKey, draftId);
    return;
  }

  window.sessionStorage.removeItem(storageKey);
}

function hasContactDetails(payload) {
  return Boolean(String(payload?.email || "").trim() || String(payload?.phone || "").trim());
}

function canCreateDraft(payload) {
  return Boolean(payload?.privacyConsent === true && hasContactDetails(payload));
}

export function useAbandonedFormDraft({
  type,
  studioSlug = "",
  payload,
  enabled = true
}) {
  const storageKey = useMemo(
    () => `inkrevenue-form-draft:${type}:${studioSlug || "global"}`,
    [studioSlug, type]
  );
  const [draftId, setDraftId] = useState(() => readStoredDraftId(storageKey));
  const draftIdRef = useRef(draftId);
  // Språket skickas här och inte i varje formulärs payload: backend behandlar
  // det som ett spårningsfält bredvid utm-parametrarna, och båda formulären
  // hade glömt det. Utkastets påminnelse går på det här språket.
  const { language } = useLanguage();

  useEffect(() => {
    const storedDraftId = readStoredDraftId(storageKey);
    setDraftId(storedDraftId);
    draftIdRef.current = storedDraftId;
  }, [storageKey]);

  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const hasExistingDraft = Boolean(draftIdRef.current);

    if (!hasExistingDraft && !canCreateDraft(payload)) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const savePayload = {
        ...payload,
        draftId: draftIdRef.current || "",
        language,
        ...getTrackingPayload()
      };
      const request =
        type === "studio_lead" && studioSlug
          ? savePublicStudioLeadDraft(studioSlug, savePayload)
          : type === "strategy_call"
            ? saveStrategyCallDraft(savePayload)
            : null;

      if (!request) {
        return;
      }

      request
        .then((response) => {
          const nextDraftId = String(response?.id || "").trim();

          if (!nextDraftId || nextDraftId === draftIdRef.current) {
            return;
          }

          draftIdRef.current = nextDraftId;
          setDraftId(nextDraftId);
          writeStoredDraftId(storageKey, nextDraftId);
        })
        .catch(() => {});
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [enabled, language, payload, storageKey, studioSlug, type]);

  function clearDraft() {
    draftIdRef.current = "";
    setDraftId("");
    writeStoredDraftId(storageKey, "");
  }

  return {
    draftId,
    clearDraft
  };
}
