export interface Offer {
  id: string
  title: string
  icon: string
  /** Short mocked blurb, shown next to the picture at grid size 1. */
  description?: string
}

// Placeholder data for the prototype — real offers come from the Ads/Offers pages (out of scope
// here). 16 entries each so grid size 4 (a 4x4 grid) always has enough to show.
export const MOCK_ADS: Offer[] = [
  { id: 'ad-1', title: 'Guitar lessons', icon: '🎸', description: 'Learn the basics of guitar from a friendly neighbor.' },
  { id: 'ad-2', title: 'Bike repair', icon: '🚲', description: 'Get your bike tuned up and rolling again.' },
  { id: 'ad-3', title: 'Spanish tutoring', icon: '🗣️', description: 'Practice conversational Spanish over coffee.' },
  { id: 'ad-4', title: 'Garden help', icon: '🌱', description: 'An extra pair of hands for planting and weeding.' },
  { id: 'ad-5', title: 'Furniture', icon: '🪑', description: 'A solid wooden chair, gently used.' },
  { id: 'ad-6', title: 'Baking', icon: '🍞', description: 'Fresh sourdough, baked to order.' },
  { id: 'ad-7', title: 'Yoga session', icon: '🧘', description: 'A relaxing hour of guided yoga.' },
  { id: 'ad-8', title: 'Math tutoring', icon: '➗', description: 'Homework help for algebra and geometry.' },
  { id: 'ad-9', title: 'Dog grooming', icon: '🐩', description: 'Bath, brush, and trim for your pup.' },
  { id: 'ad-10', title: 'Photography', icon: '📸', description: 'A portrait session in natural light.' },
  { id: 'ad-11', title: 'Car wash', icon: '🚗', description: 'Hand wash and interior clean-up.' },
  { id: 'ad-12', title: 'Painting', icon: '🎨', description: 'A custom piece for your living room.' },
  { id: 'ad-13', title: 'Language exchange', icon: '🌍', description: 'Swap English for French, an hour a week.' },
  { id: 'ad-14', title: 'Knitting', icon: '🧶', description: 'Hand-knit scarves in any color.' },
  { id: 'ad-15', title: 'Piano tuning', icon: '🎹', description: 'Get your piano back in tune.' },
  { id: 'ad-16', title: 'Home repairs', icon: '🔧', description: 'Small fixes around the house.' },
]

export const MOCK_YOUR_OFFERS: Offer[] = [
  { id: 'mine-1', title: 'Web design', icon: '💻', description: "I'll design a simple website for your project." },
  { id: 'mine-2', title: 'Dog walking', icon: '🐕', description: 'Daily walks around the neighborhood.' },
  { id: 'mine-3', title: 'Piano lessons', icon: '🎹', description: 'Beginner-friendly piano lessons.' },
  { id: 'mine-4', title: 'Moving help', icon: '📦', description: 'An extra set of hands for moving day.' },
  { id: 'mine-5', title: 'Photography', icon: '📷', description: 'Event photography, a few hours.' },
  { id: 'mine-6', title: 'Cooking', icon: '🍳', description: 'A home-cooked meal, your choice of cuisine.' },
  { id: 'mine-7', title: 'Resume review', icon: '📝', description: 'Feedback and edits on your resume.' },
  { id: 'mine-8', title: 'Bike tuning', icon: '🔧', description: 'Basic tune-up and brake check.' },
  { id: 'mine-9', title: 'Language tutoring', icon: '🗣️', description: 'Conversational German lessons.' },
  { id: 'mine-10', title: 'Furniture assembly', icon: '🪛', description: 'Flat-pack furniture, assembled.' },
  { id: 'mine-11', title: 'Pet sitting', icon: '🐈', description: "Drop-in visits while you're away." },
  { id: 'mine-12', title: 'Guitar lessons', icon: '🎸', description: 'Beginner guitar, one hour a week.' },
  { id: 'mine-13', title: 'Gardening', icon: '🌻', description: 'Help with planting and yard cleanup.' },
  { id: 'mine-14', title: 'Tech support', icon: '🖥️', description: 'Help setting up your new laptop.' },
  { id: 'mine-15', title: 'Baking', icon: '🧁', description: 'Custom cupcakes for small events.' },
  { id: 'mine-16', title: 'Math tutoring', icon: '📐', description: 'Algebra and geometry, one-on-one.' },
]
