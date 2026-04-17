import { useLegalConsent } from "../contexts/LegalConsentContext";

export function FormLegalNotice() {
  const { openLegalDocument } = useLegalConsent();

  return (
    <p className="legal-note">
      Genom att fortsätta godkänner du Ink Revenues integritetspolicy och användarvillkor.
      Påbörjade formulär kan sparas och få påminnelser via mejl eller sms under veckan.
      {" "}
      <button className="legal-note__button" type="button" onClick={openLegalDocument}>
        Läs policyn
      </button>
    </p>
  );
}
