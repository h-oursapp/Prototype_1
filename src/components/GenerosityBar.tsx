import './GenerosityBar.css'

/** TODO #11: "based on the offer's items, skills and time, how balanced is the trade from my
 *  generosity's perspective" (Márk's own words) — with "the exact math is out of scope now" taken
 *  literally: items/skills sit on the table without moving this meter at all, since putting a real
 *  number of hours on an arbitrary item is exactly the kind of math that line rules out. Only the
 *  two sides' Time tiles — the one number both sides already agree means the same thing — feed it.
 *
 *  Pulled out of TradingPage.tsx once Inventory's own trading-table overlay (TODO #9.1) became a
 *  second real place to show it — same "two real call sites" bar TransferBox's own extraction
 *  comment sets. Both callers pass exactly the two numbers this needs; neither has to know how the
 *  bands or colours work. */
type GenerosityZone = 'you-extreme' | 'you-generous' | 'fair' | 'partner-generous' | 'partner-extreme' | 'empty'

interface Generosity {
  zone: GenerosityZone
  message: string
}

/** The band constants below were picked to match Márk's own three worked examples: offering 100h
 *  (+ an item, ignored) against 5h back lands past `GENEROSITY_EXTREME_BAND` ("extremely
 *  generous"), against 50h+10h lands past `GENEROSITY_FAIR_BAND` ("generous"), against 70h lands
 *  inside the fair band ("a fair trade") — the fair band's reciprocal and the extreme band's
 *  reciprocal then give the other side's two zones for free, by symmetry. */
const GENEROSITY_FAIR_BAND = 1.6
const GENEROSITY_EXTREME_BAND = 3

// Not exported: react-refresh's "only export components from a component file" rule (this repo's
// eslint config enforces it) means a pure helper can't share this file's export list with
// GenerosityBar itself. It's still fully exercised — just through the component's own rendered
// output (GenerosityBar.test.tsx) rather than by importing it directly, the same way this exact
// logic was already tested back when it lived as a TradingPage-private function.
function computeGenerosity(yourHours: number, partnerHours: number): Generosity {
  if (yourHours === 0 && partnerHours === 0) {
    return { zone: 'empty', message: 'Add something to the table to see how the trade balances.' }
  }
  if (partnerHours === 0) {
    return { zone: 'you-extreme', message: 'You are extremely generous!' }
  }
  const ratio = yourHours / partnerHours
  if (ratio > GENEROSITY_EXTREME_BAND) return { zone: 'you-extreme', message: 'You are extremely generous!' }
  if (ratio > GENEROSITY_FAIR_BAND) return { zone: 'you-generous', message: 'You are generous.' }
  if (ratio >= 1 / GENEROSITY_FAIR_BAND) return { zone: 'fair', message: "That's a fair trade!" }
  if (ratio >= 1 / GENEROSITY_EXTREME_BAND) return { zone: 'partner-generous', message: 'Good deal!' }
  return { zone: 'partner-extreme', message: 'This is too good to be true.' }
}

/** In the order `computeGenerosity`'s zones fall along the yourHours/partnerHours ratio — used both
 *  to look up which colour a zone gets and, via its index, as the meter's `aria-valuenow`.
 *  `'empty'` isn't in here: there's no colour to show yet. */
const GENEROSITY_ZONES: { zone: GenerosityZone; colorClass: 'is-red' | 'is-yellow' | 'is-green' }[] = [
  { zone: 'you-extreme', colorClass: 'is-red' },
  { zone: 'you-generous', colorClass: 'is-yellow' },
  { zone: 'fair', colorClass: 'is-green' },
  { zone: 'partner-generous', colorClass: 'is-yellow' },
  { zone: 'partner-extreme', colorClass: 'is-red' },
]

/** "Full of the current color... similar style as the buttons, with border and chamfer, have the
 *  text inside" (Márk) — one solid, chamfered bar rather than a 5-segment strip with a caption
 *  underneath: the message *is* the bar's own content now. `role="meter"` still carries the same
 *  numeric semantics as before for assistive tech — `aria-valuetext` is the actual message, since
 *  the zones aren't evenly spaced enough for the raw index to mean much alone.
 *
 *  `partnerHours` is "aware of what's on the trading table from my partner" (TODO #9.1) simply by
 *  being a required prop rather than something this component looks up itself — both callers
 *  (TradingPage, Inventory's overlay) already have `trade.partnerHours` on hand, so there is
 *  nothing extra to plumb through for either of them to pass it here. */
export function GenerosityBar({ yourHours, partnerHours }: { yourHours: number; partnerHours: number }) {
  const { zone, message } = computeGenerosity(yourHours, partnerHours)
  const activeIndex = GENEROSITY_ZONES.findIndex((entry) => entry.zone === zone)
  const colorClass = activeIndex >= 0 ? GENEROSITY_ZONES[activeIndex].colorClass : ''

  return (
    <div
      className={`generosity-bar ${colorClass}`}
      role="meter"
      aria-label="Generosity meter"
      aria-valuemin={0}
      aria-valuemax={GENEROSITY_ZONES.length - 1}
      {...(activeIndex >= 0 ? { 'aria-valuenow': activeIndex } : {})}
      aria-valuetext={message}
    >
      {message}
    </div>
  )
}
