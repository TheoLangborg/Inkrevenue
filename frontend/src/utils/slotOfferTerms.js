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
 */
export function buildSlotOfferTermsView(terms) {
  if (!terms) return [];

  const amount = Number(terms.prepaymentAmountSek) || 0;
  const isDeposit = terms.prepaymentKind === "deposit" && amount > 0;
  const isFee = terms.prepaymentKind === "booking_fee" && amount > 0;
  const noticeHours = Number(terms.cancellationNoticeHours) || 0;

  const rows = [];

  if (isDeposit) {
    rows.push({
      key: "deposit",
      label: "Deposition",
      text: `${amount} kr. Studion tar ut den när tiden bekräftas — du betalar inget här.`
    });
  }

  if (isFee) {
    rows.push({
      key: "booking_fee",
      label: "Bokningsavgift",
      text:
        `${amount} kr. Studion tar ut den när tiden bekräftas — du betalar inget här. ` +
        "Avgiften räknas inte av mot slutpriset."
    });
  }

  if (noticeHours > 0) {
    rows.push({
      key: "cancellation",
      label: "Avbokning",
      // Följden av en sen avbokning nämns BARA för depositionen. Bokningsavgiften
      // har ingen sådan regel i bokningsvägen (applyLateCancellationToDeposit rör
      // bara depositionen), och då får sidan inte påstå att den har det.
      text: isDeposit
        ? `Senast ${noticeHours} timmar innan tiden. Avbokar du senare kan studion ta betalt för depositionen på ${amount} kr.`
        : `Senast ${noticeHours} timmar innan tiden.`
    });
  }

  return rows;
}
