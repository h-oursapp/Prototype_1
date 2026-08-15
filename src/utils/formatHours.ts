/** Turns a decimal hours figure into a compact "10h15m"-style label (Appkarte nav bar, TODO #4):
 *  just the number, no separate hours/minutes fields to keep in sync, and no icon needed once it
 *  reads clearly on its own. Minutes are dropped from the label when there aren't any, so a
 *  whole-hours balance reads as plain "12h" rather than "12h0m". */
export function formatHoursBalance(totalHours: number): string {
  let hours = Math.floor(totalHours)
  let minutes = Math.round((totalHours - hours) * 60)

  // Rounding can carry a fraction like 11.999 up to a full 60 "minutes" — fold that into the next
  // hour instead of ever showing "11h60m".
  if (minutes === 60) {
    hours += 1
    minutes = 0
  }

  return minutes === 0 ? `${hours}h` : `${hours}h${minutes}m`
}
