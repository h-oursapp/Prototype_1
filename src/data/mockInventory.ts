/** Placeholder inventory for Inventory (TODO #9), Item (TODO #10) and the Trading page (§6). */

export interface InventoryItem {
  id: string
  name: string
  icon: string
  /** Shown on the Item page (TODO #10). Empty until the user writes one — mirrors Offer's own
   *  optional `description`. */
  description?: string
  /** Appkarte §6: only items marked public are visible to a trading partner. */
  isPublic: boolean
  /** Self-rating of the item's own condition, 0–5 — mirrors Skill's own self-`rating` (mockUser.ts)
   *  and is shown the same way, a `RatingBadge` pinned to the item's Inventory tile (direct
   *  feedback: "make the star rating visible for the items as well", matching Home's own Ads
   *  tiles). Not the same field as an ad's `conditionRating` (mockOffers.ts) — that one is set
   *  fresh at ad-creation time (TODO #8) and still isn't sourced from this. */
  rating: number
}

export const MOCK_YOUR_INVENTORY: InventoryItem[] = [
  {
    id: 'item-1',
    name: 'Acoustic guitar',
    icon: '🎸',
    description: 'Steel-string, a few years old, comes with a soft case.',
    isPublic: true,
    rating: 4,
  },
  {
    id: 'item-2',
    name: 'Keyboard stand',
    icon: '🎹',
    description: 'Adjustable height, folds flat.',
    isPublic: true,
    rating: 5,
  },
  {
    id: 'item-3',
    name: 'Drill',
    icon: '🪛',
    description: 'Corded, with a small bit set.',
    isPublic: true,
    rating: 4,
  },
  { id: 'item-4', name: 'Ladder', icon: '🪜', isPublic: true, rating: 3 },
  { id: 'item-5', name: 'Camera', icon: '📷', isPublic: false, rating: 4 },
  { id: 'item-6', name: 'Tent', icon: '⛺', description: '4-person, used twice.', isPublic: true, rating: 5 },
  { id: 'item-7', name: 'Passport folder', icon: '📁', isPublic: false, rating: 3 },
  { id: 'item-8', name: 'Bread tin', icon: '🍞', isPublic: true, rating: 4 },
  {
    id: 'item-9',
    name: 'Portable speaker',
    icon: '🔊',
    description: 'Bluetooth, lasts about 8 hours.',
    isPublic: true,
    rating: 5,
  },
  {
    id: 'item-10',
    name: 'Chess set',
    icon: '♟️',
    description: 'Wooden pieces, folding board.',
    isPublic: true,
    rating: 5,
  },
  { id: 'item-11', name: 'Yoga mat', icon: '🧘', isPublic: true, rating: 3 },
  {
    id: 'item-12',
    name: 'Toolbox',
    icon: '🧰',
    description: 'Basic hand tools, a few sizes of screwdriver.',
    isPublic: true,
    rating: 4,
  },
  { id: 'item-13', name: 'Coffee grinder', icon: '☕', isPublic: true, rating: 4 },
  {
    id: 'item-14',
    name: 'Board game bundle',
    icon: '🎲',
    description: 'Three family games, all pieces present.',
    isPublic: true,
    rating: 5,
  },
  { id: 'item-15', name: 'Winter coat', icon: '🧥', isPublic: false, rating: 3 },
  { id: 'item-16', name: 'Electric kettle', icon: '🫖', isPublic: true, rating: 4 },
  { id: 'item-17', name: 'Garden hose', icon: '🚿', isPublic: true, rating: 3 },
  { id: 'item-18', name: 'Old phone', icon: '📱', isPublic: false, rating: 2 },
  {
    id: 'item-19',
    name: 'Skateboard',
    icon: '🛹',
    description: 'A few scuffs, wheels still smooth.',
    isPublic: true,
    rating: 3,
  },
  { id: 'item-20', name: 'Painting supplies', icon: '🎨', isPublic: true, rating: 4 },
]

export const MOCK_PARTNER_INVENTORY: InventoryItem[] = [
  { id: 'p-item-1', name: 'Amplifier', icon: '🔊', isPublic: true, rating: 4 },
  { id: 'p-item-2', name: 'Capo', icon: '🎵', isPublic: true, rating: 5 },
  { id: 'p-item-3', name: 'Bike pump', icon: '🚲', isPublic: true, rating: 4 },
  { id: 'p-item-4', name: 'Sewing machine', icon: '🧵', isPublic: true, rating: 4 },
  // Present in the data but never shown to you — the partner's private items stay hidden (§6).
  { id: 'p-item-5', name: 'Private box', icon: '🔒', isPublic: false, rating: 3 },
  { id: 'p-item-6', name: 'Toolbox', icon: '🧰', isPublic: true, rating: 4 },
  { id: 'p-item-7', name: 'Yoga mat', icon: '🧘', isPublic: true, rating: 4 },
  { id: 'p-item-8', name: 'Old radio', icon: '📻', isPublic: true, rating: 3 },
  { id: 'p-item-9', name: 'Garden shears', icon: '✂️', isPublic: true, rating: 4 },
  { id: 'p-item-10', name: 'Cooler box', icon: '🧊', isPublic: true, rating: 4 },
  { id: 'p-item-11', name: 'Private drawer', icon: '🔒', isPublic: false, rating: 3 },
  { id: 'p-item-12', name: 'Kids scooter', icon: '🛴', isPublic: true, rating: 4 },
]

/** Looks up one of *your* items by id, for the Item page (TODO #10) — mirrors findOffer/findSkill.
 *  Partner items aren't navigable to a detail page (§6 only ever shows theirs inline), so this
 *  only searches your own inventory. */
export function findItem(itemId: string | undefined): InventoryItem | undefined {
  return MOCK_YOUR_INVENTORY.find((item) => item.id === itemId)
}

/** What a trading partner is allowed to see of someone's inventory (§6). */
export function publicItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => item.isPublic)
}
