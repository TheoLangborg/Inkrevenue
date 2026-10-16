import { SiteLink } from "../utils/siteRouter";
import { useLanguage } from "../i18n/LanguageContext";
import { SITE_OPERATOR, SITE_OPERATOR_ADDRESS } from "../data/siteOperator";

/**
 * Säljaruppgifterna på sidor som saknar sidfot: betallänken och
 * erbjudandesidan. Samma uppgifter som SiteFooter, på en rad.
 */
export function SiteOperatorNote() {
  const { t } = useLanguage();

  return (
    <p className="site-operator-note">
      {t("footer.operatorNote", {
        name: SITE_OPERATOR.name,
        address: SITE_OPERATOR_ADDRESS,
        email: SITE_OPERATOR.email
      })}{" "}
      <SiteLink href="/integritetspolicy">{t("footer.privacy")}</SiteLink>
    </p>
  );
}
