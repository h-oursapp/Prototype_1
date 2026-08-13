export interface Offer {
  id: string
  title: string
  icon: string
}

// Placeholder data for the prototype — real offers come from the Ads/Offers pages (out of scope here).
export const MOCK_ADS: Offer[] = [
  { id: 'ad-1', title: 'Guitar lessons', icon: '🎸' },
  { id: 'ad-2', title: 'Bike repair', icon: '🚲' },
  { id: 'ad-3', title: 'Spanish tutoring', icon: '🗣️' },
  { id: 'ad-4', title: 'Garden help', icon: '🌱' },
  { id: 'ad-5', title: 'Furniture', icon: '🪑' },
  { id: 'ad-6', title: 'Baking', icon: '🍞' },
]

export const MOCK_YOUR_OFFERS: Offer[] = [
  { id: 'mine-1', title: 'Web design', icon: '💻' },
  { id: 'mine-2', title: 'Dog walking', icon: '🐕' },
  { id: 'mine-3', title: 'Piano lessons', icon: '🎹' },
  { id: 'mine-4', title: 'Moving help', icon: '📦' },
  { id: 'mine-5', title: 'Photography', icon: '📷' },
  { id: 'mine-6', title: 'Cooking', icon: '🍳' },
]
