/** Placeholder social data for the Community page (§9): friends list, blocked persons, and the
 *  message board. */

/** TODO #2.2: a stand-in invite link the onboarding "Add friends" step lets you copy. Doesn't
 *  resolve anywhere real — there's no invite/referral backend in this prototype, only the copy
 *  box the TODO actually asks for. */
export const MOCK_INVITE_LINK = 'https://h-ours.app/invite/mark-nemeth'

export interface Friend {
  id: string
  name: string
  avatar: string
  /** What they're best known for trading — the card doesn't specify what a friend row shows,
   *  so this stands in as the one useful detail. */
  headline: string
  location: string
  /** Friends you've actually traded with, so the list has some texture. */
  tradedWith: boolean
}

export const MOCK_FRIENDS: Friend[] = [
  { id: 'friend-1', name: 'Lena K.', avatar: '👩', headline: 'Guitar lessons, amp repair', location: 'Vienna, AT', tradedWith: true },
  { id: 'friend-2', name: 'Tomas R.', avatar: '🧔', headline: 'Bike repair', location: 'Vienna, AT', tradedWith: true },
  { id: 'friend-3', name: 'Aisha M.', avatar: '👩🏽', headline: 'Spanish, translation', location: 'Graz, AT', tradedWith: true },
  { id: 'friend-4', name: 'Jonas B.', avatar: '👨', headline: 'Gardening, tree work', location: 'Vienna, AT', tradedWith: true },
  { id: 'friend-5', name: 'Petra S.', avatar: '👵', headline: 'Baking, preserves', location: 'Linz, AT', tradedWith: true },
  { id: 'friend-6', name: 'Ravi N.', avatar: '👨🏽', headline: 'Web development', location: 'Vienna, AT', tradedWith: false },
  { id: 'friend-7', name: 'Mia H.', avatar: '👧', headline: 'Dog walking, pet sitting', location: 'Vienna, AT', tradedWith: false },
]

export interface BlockedPerson {
  id: string
  name: string
  avatar: string
  blockedOn: string
}

export const MOCK_BLOCKED: BlockedPerson[] = [
  { id: 'blocked-1', name: 'Anon U.', avatar: '👤', blockedOn: 'March 2026' },
  { id: 'blocked-2', name: 'Spam Account', avatar: '👤', blockedOn: 'June 2026' },
]

export interface BoardPost {
  id: string
  author: string
  avatar: string
  text: string
  time: string
  replies: number
}

/** §9 calls this a "message board for community communication" and says no more, so these are
 *  deliberately ordinary neighbourhood posts rather than an invented feature set. */
export const MOCK_BOARD_POSTS: BoardPost[] = [
  {
    id: 'post-1',
    author: 'Lena K.',
    avatar: '👩',
    text: 'Anyone have a ladder I could borrow for a weekend? Happy to trade an hour of guitar for it.',
    time: '20 minutes ago',
    replies: 3,
  },
  {
    id: 'post-2',
    author: 'Jonas B.',
    avatar: '👨',
    text: 'Starting a shared tool shelf for the district — if you have tools sitting unused, mark them public.',
    time: '2 hours ago',
    replies: 8,
  },
  {
    id: 'post-3',
    author: 'Aisha M.',
    avatar: '👩🏽',
    text: 'Language exchange evening on Thursday, everyone welcome. Bring something to drink.',
    time: 'Yesterday',
    replies: 12,
  },
  {
    id: 'post-4',
    author: 'Petra S.',
    avatar: '👵',
    text: 'Thank you to whoever fixed the bench by the playground. That was a lovely surprise.',
    time: '3 days ago',
    replies: 5,
  },
]
