/** Placeholder account data for the prototype. Nothing here persists — it exists so the pages
 *  have something realistic to lay out. */

export const MOCK_HOURS_BALANCE = 12

/** Appkarte §7: charity and foundation hours are listed on the Wallet but their mechanics are
 *  still [OFFEN] and out of scope, so they're shown as figures without any way to move them. */
export const MOCK_WALLET = {
  availableHours: MOCK_HOURS_BALANCE,
  charityHours: 3,
  foundationHours: 0,
  paymentMethod: 'Visa •••• 4417',
}

export interface Skill {
  id: string
  name: string
  icon: string
  /** Shown on the Skill page (TODO #7). Empty until the user writes one. */
  description?: string
  /** Self-rating, 0–5. Appkarte §7: 4★ and up needs proof. */
  rating: number
  /** The average score left by others in reviews of this skill — separate from the self-rating
   *  above (TODO #5–#7: "the upper one is your rating of the skill, the lower is the review
   *  score"). Not optional: every skill carries one, 0 until a review exists to average. */
  reviewRating: number
  /** What was submitted as proof, when the rating requires it. */
  proof?: string
  /** Custom skills are user-created and capped per user (§7). */
  isCustom?: boolean
}

export const MOCK_SKILLS: Skill[] = [
  {
    id: 'skill-1',
    name: 'Web design',
    icon: '💻',
    description: 'Responsive sites and shop pages, from a blank page to something you can launch.',
    rating: 5,
    reviewRating: 5, // matches review-1 (Lena K.)
    proof: 'Portfolio: 12 client sites',
  },
  {
    id: 'skill-2',
    name: 'Piano',
    icon: '🎹',
    description: 'Lessons for beginners through intermediate, classical or pop.',
    rating: 4,
    reviewRating: 4, // matches review-2 (Tomas R.)
    proof: 'Conservatory certificate, 2019',
  },
  {
    id: 'skill-3',
    name: 'Cooking',
    icon: '🍳',
    description: 'Home-style meals, mostly Central European.',
    rating: 3,
    reviewRating: 4, // matches review-3 (Aisha M.)
  },
  {
    id: 'skill-4',
    name: 'Gardening',
    icon: '🌻',
    description: 'Beds, pruning, and general upkeep.',
    rating: 3,
    reviewRating: 0, // no reviews yet
  },
  {
    id: 'skill-5',
    name: 'Photography',
    icon: '📷',
    description: 'Portraits and events, still building a portfolio.',
    rating: 2,
    reviewRating: 0, // no reviews yet
    isCustom: true,
  },
]

/** §6 mirrors your skills sidebar onto the trading partner, so the partner needs skills of
 *  their own — reusing yours would read as real data that happens to be identical. */
export const MOCK_PARTNER_SKILLS: Skill[] = [
  {
    id: 'p-skill-1',
    name: 'Guitar',
    icon: '🎸',
    description: 'Acoustic and electric, beginner-friendly.',
    rating: 5,
    reviewRating: 5,
    proof: 'Ten years teaching, references on file',
  },
  {
    id: 'p-skill-2',
    name: 'Bike repair',
    icon: '🚲',
    description: 'Brakes, gears, punctures — most things short of a full overhaul.',
    rating: 4,
    reviewRating: 4,
    proof: 'Worked at a bike shop, 2021–2024',
  },
  {
    id: 'p-skill-3',
    name: 'Sewing',
    icon: '🧵',
    description: 'Repairs and simple alterations.',
    rating: 3,
    reviewRating: 0,
  },
]

/** Looks up one of *your* skills by id, for the Skill page (§7). Partner skills aren't navigable
 *  to a detail page yet, so this only searches MOCK_SKILLS — mirrors findOffer/findTrade. */
export function findSkill(skillId: string | undefined): Skill | undefined {
  return MOCK_SKILLS.find((skill) => skill.id === skillId)
}

/** Stands in for the searchable predefined list skills get added from (§7). */
export const SKILL_CATALOG: { name: string; icon: string }[] = [
  { name: 'Baking', icon: '🍞' },
  { name: 'Bike repair', icon: '🚲' },
  { name: 'Carpentry', icon: '🪚' },
  { name: 'Childcare', icon: '🧸' },
  { name: 'Dog walking', icon: '🐕' },
  { name: 'Electrical work', icon: '💡' },
  { name: 'French', icon: '🇫🇷' },
  { name: 'Guitar', icon: '🎸' },
  { name: 'Knitting', icon: '🧶' },
  { name: 'Maths tutoring', icon: '➗' },
  { name: 'Moving help', icon: '📦' },
  { name: 'Painting', icon: '🎨' },
  { name: 'Plumbing', icon: '🔧' },
  { name: 'Spanish', icon: '🗣️' },
  { name: 'Yoga', icon: '🧘' },
]

/** Appkarte §7: the cap on user-created skills. Exact number isn't fixed in the card. */
export const CUSTOM_SKILL_CAP = 5

export const MOCK_PROFILE = {
  name: 'Márk Németh',
  avatar: '🙂',
  location: 'Vienna, AT',
  memberSince: 'March 2026',
  /** §7 [OFFEN]: Nessi wants an HTML field here, Márk wants plain text. Plain text for now. */
  intro: 'Web designer and hobby pianist. Happy to trade design work for anything hands-on — I am hopeless with tools.',
  isPublic: true,
}

export interface Review {
  id: string
  author: string
  avatar: string
  /** The skill this review was left against, if it was a skill trade. */
  skill?: string
  skillRating?: number
  /** Appkarte §8: a general personal rating, separate from the skill rating. */
  personalRating: number
  comment: string
  date: string
}

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'review-1',
    author: 'Lena K.',
    avatar: '👩',
    skill: 'Web design',
    skillRating: 5,
    personalRating: 5,
    comment: 'Redesigned my shop page in an afternoon. Punctual and easy to talk to.',
    date: '2 weeks ago',
  },
  {
    id: 'review-2',
    author: 'Tomas R.',
    avatar: '🧔',
    skill: 'Piano',
    skillRating: 4,
    personalRating: 5,
    comment: 'Patient teacher, my daughter looks forward to the lessons.',
    date: '1 month ago',
  },
  {
    id: 'review-3',
    author: 'Aisha M.',
    avatar: '👩🏽',
    skill: 'Cooking',
    skillRating: 4,
    personalRating: 4,
    comment: 'Great food. Ran a little over the agreed hours, but worth it.',
    date: '2 months ago',
  },
]
