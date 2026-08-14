/** Placeholder inventory for the Trading page (§6). The Inventory page itself is out of scope
 *  for the prototype, but trading needs items to put on the table. */

export interface InventoryItem {
  id: string
  name: string
  icon: string
  /** Appkarte §6: only items marked public are visible to a trading partner. */
  isPublic: boolean
  /** Shelves are exactly one level deep — no shelves inside shelves (§6). */
  shelf?: string
}

export const MOCK_YOUR_INVENTORY: InventoryItem[] = [
  { id: 'item-1', name: 'Acoustic guitar', icon: '🎸', isPublic: true, shelf: 'Music' },
  { id: 'item-2', name: 'Keyboard stand', icon: '🎹', isPublic: true, shelf: 'Music' },
  { id: 'item-3', name: 'Drill', icon: '🪛', isPublic: true, shelf: 'Tools' },
  { id: 'item-4', name: 'Ladder', icon: '🪜', isPublic: true, shelf: 'Tools' },
  { id: 'item-5', name: 'Camera', icon: '📷', isPublic: false, shelf: 'Tools' },
  { id: 'item-6', name: 'Tent', icon: '⛺', isPublic: true },
  { id: 'item-7', name: 'Passport folder', icon: '📁', isPublic: false },
  { id: 'item-8', name: 'Bread tin', icon: '🍞', isPublic: true, shelf: 'Kitchen' },
]

export const MOCK_PARTNER_INVENTORY: InventoryItem[] = [
  { id: 'p-item-1', name: 'Amplifier', icon: '🔊', isPublic: true, shelf: 'Music' },
  { id: 'p-item-2', name: 'Capo', icon: '🎵', isPublic: true, shelf: 'Music' },
  { id: 'p-item-3', name: 'Bike pump', icon: '🚲', isPublic: true },
  { id: 'p-item-4', name: 'Sewing machine', icon: '🧵', isPublic: true, shelf: 'Craft' },
  // Present in the data but never shown to you — the partner's private items stay hidden (§6).
  { id: 'p-item-5', name: 'Private box', icon: '🔒', isPublic: false },
]

export const MOCK_SHELVES = ['Music', 'Tools', 'Kitchen']

/** What a trading partner is allowed to see of someone's inventory (§6). */
export function publicItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => item.isPublic)
}
