/**
 * Grinden som avgör om formuläret ska boka en tid direkt — och därmed om kunden
 * ska betala innan förfrågan skickas. Bor här och inte inne i komponenten för
 * att kunna köras: `node --test src/utils/leadFormBooking.test.js`.
 *
 * Tre saker måste vara sanna: studion har bokningsflödet på och kunden har fyllt
 * i tillräckligt (canShowCalendar/hasEnoughDetails), servern har sagt att
 * förfrågan får direktbokas (eligibleForDirectBooking), och det finns luckor att
 * välja bland.
 *
 * Och en fjärde: kalendern måste vara FÄRSK. Efter ett misslyckat
 * omhämtningsförsök (429 från bookingPreviewLimiter, eller vilket nätverksfel
 * som helst) står förra svaret kvar i läget "stale" så att kunden inte tappar
 * kalendern — men luckorna är dimensionerade av det GAMLA estimatet, medan
 * beskrivningen som skickas in är den nya. Har texten korsat en modifierare
 * eller en storleksgräns faller den valda tiden på backendens längdkoll
 * ("Den valda tiden är 180 minuter, men estimatorn landade på 240") och
 * förfrågan går till manuell granskning EFTER att depositionen dragits.
 *
 * Därför: i "stale" bokas ingenting direkt och ingenting debiteras. Kunden får
 * fortfarande välja en tid, men den går in som ett önskemål.
 */
export function canBookDirectly({
  canShowCalendar,
  hasEnoughDetails,
  availabilityState,
  eligibleForDirectBooking,
  hasSlots
}) {
  return Boolean(
    canShowCalendar &&
      hasEnoughDetails &&
      availabilityState !== "stale" &&
      eligibleForDirectBooking &&
      hasSlots
  );
}

/**
 * Vilken förklaring tidssteget ska visa. Bor här av samma skäl som
 * canBookDirectly: ren logik, körbar med `node --test`.
 *
 * Granskning 4 punkt 3: steget hade ingen gren för "inga tider". Kom svaret
 * fram utan en enda lucka — studion har inga bokningsbara veckodagar, eller
 * allt i fönstret är upptaget — renderades ingenting alls: rubriken och
 * Tillbaka/Nästa stod kvar och kunden såg ett tomt steg mitt i formuläret.
 *
 * Andra halvan av samma punkt: när luckor VISAS men studion inte tillåter
 * direktbokning (eligibleForDirectBooking falskt) är kalendern en önskelista,
 * och det stod ingenstans — kunden trodde att hon bokade.
 *
 * @returns {"none"|"noSlots"|"stale"|"timesAreRequests"}
 */
export function resolveTimeStepNotice({
  availabilityState,
  hasSlots,
  eligibleForDirectBooking
}) {
  // "loading" har sin egen rad ("Kontrollerar lediga tider…") och behåller
  // förra svaret i data; "error" har sitt felmeddelande. Ingen av dem ska
  // dessutom påstå något om luckorna.
  if (availabilityState === "loading" || availabilityState === "error") return "none";
  // Gäller även "stale": står kalendern kvar men är tom säger stale-texten
  // ("tiderna nedan…") något som inte stämmer.
  if (!hasSlots) return "noSlots";
  // stale-texten säger redan att tiderna går in som ett önskemål.
  if (availabilityState === "stale") return "stale";
  return eligibleForDirectBooking ? "none" : "timesAreRequests";
}
