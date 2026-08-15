/** Appkarte §4: the Offers page splits into skill offers and item offers, so every offer
 *  declares which it is. */
export type OfferKind = 'skill' | 'item'

export interface Offer {
  id: string
  title: string
  icon: string
  kind: OfferKind
  /** The listed price in hours — what §5's Quick Buy would charge. */
  hours: number
  /** Short mocked blurb, shown next to the picture at grid size 1. */
  description?: string
  /** Roughly how far away, for the Search page's nearby list (§4). */
  distanceKm?: number
  /** 0–5, overlaid on Home's grid tiles alongside the name (TODO #3). A stand-in for whichever
   *  rating ends up showing here once §8 splits a skill's rating from a material's condition
   *  rating in the offer's own detail view — that split is still open, so every offer just carries
   *  one number for now. */
  rating: number
}

// Placeholder data for the prototype. 16 entries each so grid size 4 (a 4x4 grid) always has
// enough to show.
export const MOCK_ADS: Offer[] = [
  { id: 'ad-1', title: 'Guitar lessons', icon: '🎸', kind: 'skill', hours: 2, distanceKm: 0.4, description: 'Learn the basics of guitar from a friendly neighbor.', rating: 5 },
  { id: 'ad-2', title: 'Bike repair', icon: '🚲', kind: 'skill', hours: 1, distanceKm: 0.8, description: 'Get your bike tuned up and rolling again.', rating: 4 },
  { id: 'ad-3', title: 'Spanish tutoring', icon: '🗣️', kind: 'skill', hours: 2, distanceKm: 1.2, description: 'Practice conversational Spanish over coffee.', rating: 4 },
  { id: 'ad-4', title: 'Garden help', icon: '🌱', kind: 'skill', hours: 3, distanceKm: 1.5, description: 'An extra pair of hands for planting and weeding.', rating: 3 },
  { id: 'ad-5', title: 'Wooden chair', icon: '🪑', kind: 'item', hours: 4, distanceKm: 2.1, description: 'A solid wooden chair, gently used.', rating: 4 },
  { id: 'ad-6', title: 'Sourdough bread', icon: '🍞', kind: 'item', hours: 1, distanceKm: 0.6, description: 'Fresh sourdough, baked to order.', rating: 5 },
  { id: 'ad-7', title: 'Yoga session', icon: '🧘', kind: 'skill', hours: 1, distanceKm: 2.4, description: 'A relaxing hour of guided yoga.', rating: 5 },
  { id: 'ad-8', title: 'Maths tutoring', icon: '➗', kind: 'skill', hours: 2, distanceKm: 3.0, description: 'Homework help for algebra and geometry.', rating: 4 },
  { id: 'ad-9', title: 'Dog grooming', icon: '🐩', kind: 'skill', hours: 2, distanceKm: 1.1, description: 'Bath, brush, and trim for your pup.', rating: 3 },
  { id: 'ad-10', title: 'Photography', icon: '📸', kind: 'skill', hours: 3, distanceKm: 4.2, description: 'A portrait session in natural light.', rating: 5 },
  { id: 'ad-11', title: 'Car wash', icon: '🚗', kind: 'skill', hours: 1, distanceKm: 0.9, description: 'Hand wash and interior clean-up.', rating: 3 },
  { id: 'ad-12', title: 'Canvas painting', icon: '🎨', kind: 'item', hours: 6, distanceKm: 5.0, description: 'A custom piece for your living room.', rating: 4 },
  { id: 'ad-13', title: 'Language exchange', icon: '🌍', kind: 'skill', hours: 1, distanceKm: 1.8, description: 'Swap English for French, an hour a week.', rating: 5 },
  { id: 'ad-14', title: 'Knitted scarf', icon: '🧶', kind: 'item', hours: 3, distanceKm: 2.7, description: 'Hand-knit scarves in any color.', rating: 4 },
  { id: 'ad-15', title: 'Piano tuning', icon: '🎹', kind: 'skill', hours: 2, distanceKm: 3.6, description: 'Get your piano back in tune.', rating: 4 },
  { id: 'ad-16', title: 'Home repairs', icon: '🔧', kind: 'skill', hours: 2, distanceKm: 1.4, description: 'Small fixes around the house.', rating: 3 },
]

// Deliberately a mix of both kinds, so the Offers page's skill and item sections are both
// populated in the prototype.
export const MOCK_YOUR_OFFERS: Offer[] = [
  { id: 'mine-1', title: 'Web design', icon: '💻', kind: 'skill', hours: 4, description: "I'll design a simple website for your project.", rating: 5 },
  { id: 'mine-2', title: 'Dog walking', icon: '🐕', kind: 'skill', hours: 1, description: 'Daily walks around the neighborhood.', rating: 4 },
  { id: 'mine-3', title: 'Piano lessons', icon: '🎹', kind: 'skill', hours: 1, description: 'Beginner-friendly piano lessons.', rating: 4 },
  { id: 'mine-4', title: 'Moving help', icon: '📦', kind: 'skill', hours: 3, description: 'An extra set of hands for moving day.', rating: 3 },
  { id: 'mine-5', title: 'Event photography', icon: '📷', kind: 'skill', hours: 3, description: 'Event photography, a few hours.', rating: 3 },
  { id: 'mine-6', title: 'Home cooking', icon: '🍳', kind: 'skill', hours: 2, description: 'A home-cooked meal, your choice of cuisine.', rating: 4 },
  { id: 'mine-7', title: 'Resume review', icon: '📝', kind: 'skill', hours: 1, description: 'Feedback and edits on your resume.', rating: 3 },
  { id: 'mine-8', title: 'Bike tuning', icon: '🔧', kind: 'skill', hours: 1, description: 'Basic tune-up and brake check.', rating: 4 },
  { id: 'mine-9', title: 'Desk lamp', icon: '💡', kind: 'item', hours: 2, description: 'Adjustable desk lamp, barely used.', rating: 4 },
  { id: 'mine-10', title: 'Bookshelf', icon: '🗄️', kind: 'item', hours: 5, description: 'Pine bookshelf, some scuffs on the back.', rating: 3 },
  { id: 'mine-11', title: 'Board games', icon: '🎲', kind: 'item', hours: 2, description: 'A bundle of three, all complete.', rating: 5 },
  { id: 'mine-12', title: 'Acoustic guitar', icon: '🎸', kind: 'item', hours: 8, description: 'Starter acoustic, new strings fitted.', rating: 4 },
  { id: 'mine-13', title: 'Plant cuttings', icon: '🌻', kind: 'item', hours: 1, description: 'Monstera and pothos cuttings, rooted.', rating: 5 },
  { id: 'mine-14', title: 'Monitor stand', icon: '🖥️', kind: 'item', hours: 1, description: 'Simple wooden riser for a monitor.', rating: 3 },
  { id: 'mine-15', title: 'Cupcake tin', icon: '🧁', kind: 'item', hours: 1, description: 'Twelve-cup tin, non-stick.', rating: 4 },
  { id: 'mine-16', title: 'Drawing set', icon: '📐', kind: 'item', hours: 2, description: 'Compass, rulers and pencils in a case.', rating: 4 },
]

/** Your own listings are the ones the Appkarte lets you edit; everything else is someone
 *  else's ad (§5). */
export function findOffer(offerId: string | undefined): Offer | undefined {
  return [...MOCK_ADS, ...MOCK_YOUR_OFFERS].find((offer) => offer.id === offerId)
}

export function isYourOffer(offer: Offer): boolean {
  return MOCK_YOUR_OFFERS.some((yours) => yours.id === offer.id)
}
