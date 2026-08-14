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
  /** Human-readable "last interaction", shown as-is on the trade card (§8). */
  lastInteraction: string
  /** The same moment as `lastInteraction`, as a real ISO date — TODO #12 asks Trades to order by
   *  date, which prose like "2 weeks ago" can't be sorted by (flagged as a known gap in
   *  HANDOFF.md §13). Kept alongside the prose field rather than replacing it, the same way
   *  Skill.rating and Skill.reviewRating already coexist: display text stays exactly as authored,
   *  and sorting gets something real to compare. */
  lastInteractionAt: string
  /** TODO #12: shows an unread-message icon on the trade's card. A flag on the mock data rather
   *  than a computed "last message is from partner and I haven't opened it" rule — there's no
   *  per-user read state anywhere else in this prototype either, so this matches how every other
   *  per-trade fact here is just declared rather than derived. */
  hasUnreadMessage?: boolean
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
    lastInteractionAt: '2026-08-14T09:24:00Z',
    hasUnreadMessage: true,
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
    lastInteractionAt: '2026-08-14T07:30:00Z',
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
    lastInteractionAt: '2026-08-13T18:00:00Z',
    hasUnreadMessage: true,
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
    lastInteractionAt: '2026-08-11T10:00:00Z',
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
    lastInteractionAt: '2026-07-31T12:00:00Z',
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
    lastInteractionAt: '2026-07-31T09:00:00Z',
    messages: [{ id: 'm-9', from: 'partner', text: 'Site looks great, thank you!', time: '2 weeks ago' }],
  },
]

export function findTrade(tradeId: string | undefined): Trade | undefined {
  return MOCK_TRADES.find((trade) => trade.id === tradeId)
}

/** TODO #13's status pipeline is "not existing → open → agreed → closed", each step triggered by
 *  one particular action and never skipped or reversed past `open`. These two pure functions are
 *  that pipeline's rules, kept separate from any one page so TradingPage's Accept/Decline buttons
 *  and their tests both read off the same source of truth rather than each re-stating it.
 *
 *  Only 'open' is covered: 'agreed' has already been responded to, and 'closed' is Final Review's
 *  job (§8, already built) rather than something Accept/Decline on the Trading page ever touches. */

/** Whether this trade currently has a live offer to respond to — i.e. whether Accept/Decline
 *  should be shown at all. */
export function canRespondToOffer(status: TradeStatus): boolean {
  return status === 'open'
}

/** The status after accepting an open offer. Every other status has nothing to accept — callers
 *  are expected to gate the button on canRespondToOffer first, so this only has to state the one
 *  real transition rather than guard against the others. Declining has no status transition of
 *  its own: TODO #13 says a decline lets "the other side make a new offer", i.e. the trade simply
 *  stays open while the offer itself changes back on TradingPage. */
export function statusAfterAccept(status: TradeStatus): TradeStatus {
  return status === 'open' ? 'agreed' : status
}
