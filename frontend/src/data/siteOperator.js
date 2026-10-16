/**
 * Vem som driver sajten. e-handelslagen 8 § kräver namn, geografisk adress och
 * e-post, lätta att hitta. "Ink Revenue" är ett varumärke, inte en juridisk
 * person: säljaren är Theo Langborgs enskilda firma.
 *
 * Läses av sidfoten, raden på betal- och erbjudandesidorna och
 * integritetspolicyn. JSON-LD-blocket i index.html har samma uppgifter och måste
 * ändras för hand.
 */
export const SITE_OPERATOR = {
  name: "Theo Langborg",
  streetAddress: "Lämmenäs 104",
  postalCode: "612 91",
  city: "Finspång",
  email: "info@inkrevenue.online"
};

export const SITE_OPERATOR_ADDRESS = `${SITE_OPERATOR.streetAddress}, ${SITE_OPERATOR.postalCode} ${SITE_OPERATOR.city}`;
