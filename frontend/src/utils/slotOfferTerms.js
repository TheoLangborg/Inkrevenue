import { createTranslator } from "../i18n/translate.js";

/**
 * Villkorstexterna på /tid/:token.
 *
 * Punkt 14 i luckåtervinningsgranskningen: sidan visade tid, längd, artist och
 * en ja-knapp. Bokningen som skapas bär studions deposition som OBETALD och
 * studions avbokningsfönster — kunden band sig alltså till pengar och regler hon
 * aldrig fick se, till skillnad från i det publika bokningsformuläret.
 *
 * Egen modul och ren funktion av samma skäl som `campaignBanner.js`: frontenden
 * har ingen testrunner, och det här är text om pengar. Körs med
 * `node --test src/utils/slotOfferTerms.test.js`.
 *
 * Beloppen kommer FÄRDIGA från servern (samma resolver som bokningen använder).
 * Den här filen väljer bara meningar — den räknar aldrig ut ett belopp ur
 * flaggor, för det var precis så konsultationen kunde visas fel i formuläret.
 *
 * Meningarna ligger under slotOffer.terms i sv.js och en.js.
 */
export function buildSlotOfferTermsView(terms, language = "sv") {
  if (!terms) return [];

  const { t } = createTranslator(language);

  const amount = Number(terms.prepaymentAmountSek) || 0;
  const isDeposit = terms.prepaymentKind === "deposit" && amount > 0;
  const isFee = terms.prepaymentKind === "booking_fee" && amount > 0;
  const noticeHours = Number(terms.cancellationNoticeHours) || 0;

  const rows = [];

  if (isDeposit) {
    rows.push({
      key: "deposit",
      label: t("slotOffer.terms.depositLabel"),
      text: t("slotOffer.terms.depositText", { amount })
    });
  }

  if (isFee) {
    rows.push({
      key: "booking_fee",
      label: t("slotOffer.terms.bookingFeeLabel"),
      text: t("slotOffer.terms.bookingFeeText", { amount })
    });
  }

  if (noticeHours > 0) {
    rows.push({
      key: "cancellation",
      label: t("slotOffer.terms.cancellationLabel"),
      // Följden av en sen avbokning nämns BARA för depositionen. Bokningsavgiften
      // har ingen sådan regel i bokningsvägen (applyLateCancellationToDeposit rör
      // bara depositionen), och då får sidan inte påstå att den har det.
      text: isDeposit
        ? t("slotOffer.terms.cancellationDepositText", { hours: noticeHours, amount })
        : t("slotOffer.terms.cancellationText", { hours: noticeHours })
    });
  }

  return rows;
}
