import './RatingBadge.css'

interface RatingBadgeProps {
  value: number
}

/** "5★" — a compact stand-in for a full row of stars, for spots with no room to spare: Search's
 *  result tiles (TODO #13) and Home's Ads grid (TODO #3), pinned to a tile's corner.
 *
 *  Purely decorative (`aria-hidden`): every caller already folds the rating into the tile's own
 *  accessible name — e.g. "Guitar lessons, rated 4 out of 5" — so a screen reader isn't told the
 *  number twice. The tile it sits on must be `position: relative` for the pin to land correctly;
 *  every SquareTile already is. */
export function RatingBadge({ value }: RatingBadgeProps) {
  return (
    <span className="rating-badge" aria-hidden="true">
      {value}★
    </span>
  )
}
