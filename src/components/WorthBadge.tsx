import './WorthBadge.css'

interface WorthBadgeProps {
  hours: number
}

/** "6h" / "0.5h" — an item's worth in hours (Márk's own direct ask this session, "Items worth"),
 *  pinned to a tile's top-left corner. Mirrors `RatingBadge`'s top-right "N★" pin exactly, just the
 *  opposite corner, so a tile can carry both at once without them colliding.
 *
 *  Items only, for now — `InventoryItem` is the only mock type that carries a `worth` field; Skills
 *  and Offers don't, so there's no caller for this outside Inventory's own item tiles and the
 *  partner's read-only inventory.
 *
 *  Purely decorative (`aria-hidden`), same reasoning as `RatingBadge`: every caller already folds
 *  the worth into the tile's own accessible name, so a screen reader isn't told the number twice.
 *  The tile it sits on must be `position: relative` for the pin to land correctly; every SquareTile
 *  already is. */
export function WorthBadge({ hours }: WorthBadgeProps) {
  return (
    <span className="worth-badge" aria-hidden="true">
      {hours}h
    </span>
  )
}
