import { getLegalDocuments } from "../data/legalContent";
import { SiteLink } from "../utils/siteRouter";
import { useLanguage } from "../i18n/LanguageContext";

export function LegalDocumentModal({ activeDocument, onClose }) {
  const { t, isEnglish, language } = useLanguage();
  const content = getLegalDocuments(language)[activeDocument];

  if (!content) {
    return null;
  }

  const documentLabel =
    activeDocument === "privacy" ? t("legal.privacyLabel") : t("legal.termsLabel");

  return (
    <div className="legal-document" role="presentation">
      <div className="legal-document__backdrop" onClick={onClose} />
      <section
        className="legal-document__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-document-title"
      >
        <div className="legal-document__header">
          <div>
            <p className="eyebrow">{documentLabel}</p>
            <h2 id="legal-document-title">{content.title}</h2>
          </div>
          <button
            className="legal-document__close"
            type="button"
            onClick={onClose}
            aria-label={t("legal.closeDocument")}
          >
            ×
          </button>
        </div>

        <div className="legal-document__content">
          {/* Den engelska texten är en översättning; den svenska versionen är
              den juridiskt bindande. Notisen säger det till engelska läsare. */}
          {isEnglish ? (
            <p className="legal-page__language-notice">{t("legal.translationNotice")}</p>
          ) : null}

          {content.groups.map((group) => (
            <section key={group.heading}>
              <h3>{group.heading}</h3>
              {group.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}

          <p>
            <SiteLink href={content.path} onClick={onClose}>
              {t("legal.openAsPage")}
            </SiteLink>
          </p>
        </div>
      </section>
    </div>
  );
}
