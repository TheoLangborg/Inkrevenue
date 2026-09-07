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
