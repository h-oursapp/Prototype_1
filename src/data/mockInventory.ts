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
}

export const MOCK_YOUR_INVENTORY: InventoryItem[] = [
  {
    id: 'item-1',
    name: 'Acoustic guitar',
    icon: '🎸',
    description: 'Steel-string, a few years old, comes with a soft case.',
    isPublic: true,
  },
  { id: 'item-2', name: 'Keyboard stand', icon: '🎹', description: 'Adjustable height, folds flat.', isPublic: true },
  { id: 'item-3', name: 'Drill', icon: '🪛', description: 'Corded, with a small bit set.', isPublic: true },
  { id: 'item-4', name: 'Ladder', icon: '🪜', isPublic: true },
  { id: 'item-5', name: 'Camera', icon: '📷', isPublic: false },
  { id: 'item-6', name: 'Tent', icon: '⛺', description: '4-person, used twice.', isPublic: true },
  { id: 'item-7', name: 'Passport folder', icon: '📁', isPublic: false },
  { id: 'item-8', name: 'Bread tin', icon: '🍞', isPublic: true },
]

export const MOCK_PARTNER_INVENTORY: InventoryItem[] = [
  { id: 'p-item-1', name: 'Amplifier', icon: '🔊', isPublic: true },
  { id: 'p-item-2', name: 'Capo', icon: '🎵', isPublic: true },
  { id: 'p-item-3', name: 'Bike pump', icon: '🚲', isPublic: true },
  { id: 'p-item-4', name: 'Sewing machine', icon: '🧵', isPublic: true },
  // Present in the data but never shown to you — the partner's private items stay hidden (§6).
  { id: 'p-item-5', name: 'Private box', icon: '🔒', isPublic: false },
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
