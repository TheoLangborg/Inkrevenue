import { createContext, useContext, useEffect, useState } from "react";
import { LegalDocumentModal } from "../components/LegalDocumentModal";

/**
 * Öppnar integritetspolicyn och villkoren i en modal (FormLegalLinks).
 *
 * Här fanns tidigare en samtyckesruta som visades vid första besöket och låste
 * formulären tills besökaren klickat "Godkänn". Den togs bort efter den
 * juridiska granskningen 2026-10-16: att svara på en förfrågan kräver inget
 * samtycke, bara information, och ett samtycke som villkorar tjänsten är inte
 * frivilligt. Det enda som kräver samtycke, påminnelserna, har en egen ruta i
 * formulären.
 */

const LegalConsentContext = createContext(null);

export function LegalConsentProvider({ children }) {
  const [activeDocument, setActiveDocument] = useState(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    if (activeDocument) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeDocument]);

  const value = {
    openLegalDocument: setActiveDocument,
    closeLegalDocument: () => setActiveDocument(null)
  };

  return (
    <LegalConsentContext.Provider value={value}>
      {children}
      <LegalDocumentModal activeDocument={activeDocument} onClose={value.closeLegalDocument} />
    </LegalConsentContext.Provider>
  );
}

export function useLegalConsent() {
  const context = useContext(LegalConsentContext);

  if (!context) {
    throw new Error("useLegalConsent must be used within LegalConsentProvider.");
  }

  return context;
}
