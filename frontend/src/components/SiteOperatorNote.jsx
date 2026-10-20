import { useId, useState } from "react";
import { SiteLink } from "../utils/siteRouter";
import { useLanguage } from "../i18n/LanguageContext";
import { SITE_OPERATOR, SITE_OPERATOR_ADDRESS } from "../data/siteOperator";

/**
 * Säljaruppgifterna på sidor som saknar sidfot: betallänken och
 * erbjudandesidan. Samma uppgifter som SiteFooter, men ihopfällda bakom
 * "Om sidan" så att de inte tar plats på en sida kunden öppnar från ett SMS.
 * De ligger kvar i sidan och visas med ett tryck.
 */
export function SiteOperatorNote() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const infoId = useId();

  return (
    <div className="site-operator-note">
      <div className="site-operator-note__links">
        <button
          type="button"
          className="site-operator-note__toggle"
          aria-expanded={open}
          aria-controls={infoId}
          onClick={() => setOpen((current) => !current)}
        >
          {t("footer.aboutSite")}
        </button>
        <span aria-hidden="true">·</span>
        <SiteLink href="/integritetspolicy">{t("footer.privacy")}</SiteLink>
      </div>
      <p id={infoId} className="site-operator-note__info" hidden={!open}>
        {t("footer.operatorNote", {
          name: SITE_OPERATOR.name,
          address: SITE_OPERATOR_ADDRESS,
          email: SITE_OPERATOR.email
        })}
      </p>
    </div>
  );
}
