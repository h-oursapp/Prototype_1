/** Placeholder trades for the Trades page (§8), the Trading page (§6) and Final Review (§8). */

/** Appkarte §8 sorts trades by status first. The card's first label is [OFFEN] — the note reads
 *  like "unridden", suspected typo — so 'open' stands in for it here. */
export type TradeStatus = 'open' | 'agreed' | 'closed'

export const TRADE_STATUS_ORDER: TradeStatus[] = ['open', 'agreed', 'closed']

export const TRADE_STATUS_LABEL: Record<TradeStatus, string> = {
  open: 'Open',
  agreed: 'Agreed',
  closed: 'Closed',
}

export interface ChatMessage {
  id: string
  /** Whose message it is — the chat log is stored locally and user-deletable (§8). */
  from: 'you' | 'partner'
  text: string
  time: string
}

export interface Trade {
  id: string
  partner: string
  partnerAvatar: string
  subject: string
  icon: string
  status: TradeStatus
  /** The personal skill (Skill.id, from mockUser.ts) this trade was about, when it was a skill
   *  trade. Added for TODO #7 — "all trades of this skill, already reviewed" needs a trade to be
   *  able to say which skill it used. Optional: item trades, and skill trades that predate this
   *  field, carry no link. See HANDOFF.md §13 for the fuller gap this is a minimum fix for. */
  skillId?: string
  /** Hours currently on your side of the trading table. */
  yourHours: number
  /** Hours the partner has put on their side. Their *balance* stays hidden from you (§6), but
   *  what they've actually offered is on the table in plain sight — that's the whole point of
   *  the table. */
  partnerHours: number
  /** Sort key within a status group — "last interaction" in §8. */
  lastInteraction: string
  messages: ChatMessage[]
}

export const MOCK_TRADES: Trade[] = [
  {
    id: 'trade-1',
    partner: 'Lena K.',
    partnerAvatar: '👩',
    subject: 'Guitar lessons',
    icon: '🎸',
    status: 'open',
    yourHours: 2,
    partnerHours: 3,
    lastInteraction: '10 minutes ago',
    messages: [
      { id: 'm-1', from: 'partner', text: 'Hi! Would two hours a week work for you?', time: '09:12' },
      { id: 'm-2', from: 'you', text: 'Two works. Could we start next Tuesday?', time: '09:20' },
      { id: 'm-3', from: 'partner', text: 'Tuesday is good. I put my amp on the table too.', time: '09:24' },
    ],
  },
  {
    id: 'trade-2',
    partner: 'Tomas R.',
    partnerAvatar: '🧔',
    subject: 'Bike repair',
    icon: '🚲',
    status: 'open',
    yourHours: 1,
    partnerHours: 1,
    lastInteraction: '2 hours ago',
    messages: [
      { id: 'm-4', from: 'you', text: 'The rear brake is rubbing — one hour should cover it?', time: 'Yesterday' },
      { id: 'm-5', from: 'partner', text: 'Should be. Bring it round any evening this week.', time: 'Yesterday' },
    ],
  },
  {
    id: 'trade-3',
    partner: 'Aisha M.',
    partnerAvatar: '👩🏽',
    subject: 'Spanish tutoring',
    icon: '🗣️',
    status: 'agreed',
    yourHours: 4,
    partnerHours: 4,
    lastInteraction: 'Yesterday',
    messages: [{ id: 'm-6', from: 'partner', text: 'Agreed — see you Thursday!', time: 'Yesterday' }],
  },
  {
    id: 'trade-4',
    partner: 'Jonas B.',
    partnerAvatar: '👨',
    subject: 'Garden help',
    icon: '🌱',
    status: 'agreed',
    yourHours: 3,
    partnerHours: 2,
    lastInteraction: '3 days ago',
    messages: [{ id: 'm-7', from: 'you', text: 'Deal. Saturday morning then.', time: '3 days ago' }],
  },
  {
    id: 'trade-5',
    partner: 'Petra S.',
    partnerAvatar: '👵',
    subject: 'Baking',
    icon: '🍞',
    status: 'closed',
    yourHours: 2,
    partnerHours: 2,
    lastInteraction: '2 weeks ago',
    messages: [{ id: 'm-8', from: 'partner', text: 'Thanks again, the bread was perfect.', time: '2 weeks ago' }],
  },
  {
    // Appended, not inserted: TradesPage.test.tsx destructures the first five trades by position
    // ([guitar, bike, spanish, garden, baking]), so a new trade only stays safe at the end.
    // Linked to skill-1 (Web design) in mockUser.ts, so Profile → Skills → Skill → "reviewed
    // trades for this skill" has one real example to click through instead of always landing on
    // an empty list. A different client from review-1's Lena K. on purpose — every partner name
    // elsewhere in this file is already unique, and two trades both "with Lena K." would make
    // TradesPage's own per-partner controls (e.g. "Delete chat log with Lena K.") ambiguous.
    id: 'trade-6',
    partner: 'Nora P.',
    partnerAvatar: '👩🏾',
    subject: 'Web design',
    icon: '💻',
    status: 'closed',
    skillId: 'skill-1',
    yourHours: 3,
    partnerHours: 3,
    lastInteraction: '2 weeks ago',
    messages: [{ id: 'm-9', from: 'partner', text: 'Site looks great, thank you!', time: '2 weeks ago' }],
  },
]

export function findTrade(tradeId: string | undefined): Trade | undefined {
  return MOCK_TRADES.find((trade) => trade.id === tradeId)
}
