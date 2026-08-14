import { useState, type FormEvent } from 'react'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import type { BlockedPerson, BoardPost, Friend } from '../data/mockCommunity'
import { MOCK_BLOCKED, MOCK_BOARD_POSTS, MOCK_FRIENDS } from '../data/mockCommunity'
import { MOCK_PROFILE } from '../data/mockUser'
import './CommunityPage.css'

/** §9 names two things that fill the page — the friends list and the message board — so they get a
 *  segmented control rather than two stacked sections, the same shape SearchPage uses for its
 *  map/text views. Friends is first because the card lists it first. */
type CommunityView = 'friends' | 'board'

const VIEW_OPTIONS: { value: CommunityView; label: string }[] = [
  { value: 'friends', label: 'Friends' },
  { value: 'board', label: 'Message board' },
]

/** Name, headline and location all count as a match. §9 says nothing about what a friend search
 *  covers, and on a list this size searching only names would find less than reading the list. */
function matchesFriendQuery(friend: Friend, query: string): boolean {
  const needle = query.trim().toLowerCase()
  return [friend.name, friend.headline, friend.location].some((field) =>
    field.toLowerCase().includes(needle),
  )
}

function findFriends(query: string): Friend[] {
  return MOCK_FRIENDS.filter((friend) => matchesFriendQuery(friend, query))
}

/** A post you write goes to the top, not the bottom: MOCK_BOARD_POSTS is listed newest-first and
 *  its times are prose ("Yesterday"), which can't be compared — the same limitation TradesPage
 *  records for "last interaction". Appending would file a brand-new post under "3 days ago". */
function writePost(text: string, postCount: number): BoardPost {
  return {
    id: `local-post-${postCount}`,
    author: MOCK_PROFILE.name,
    avatar: MOCK_PROFILE.avatar,
    text,
    time: 'Just now',
    replies: 0,
  }
}

function replyLabel(replies: number): string {
  return replies === 1 ? '1 reply' : `${replies} replies`
}

interface FriendRowProps {
  friend: Friend
  onOpen: () => void
}

/** One person in the friends list. The whole row is the tap target, so nothing else may be a
 *  button inside it — a button within a button is invalid HTML and unreachable by keyboard. */
function FriendRow({ friend, onOpen }: FriendRowProps) {
  return (
    <li className="page-card community-page__friend">
      <button
        type="button"
        className="community-page__friend-open"
        onClick={onOpen}
        aria-label={`Open ${friend.name}'s profile`}
      >
        <span className="community-page__avatar" aria-hidden="true">
          {friend.avatar}
        </span>
        <span className="community-page__friend-text">
          <span className="community-page__friend-name">{friend.name}</span>
          <span className="community-page__friend-headline">{friend.headline}</span>
          <span className="community-page__friend-meta">{friend.location}</span>
        </span>
        {friend.tradedWith && <span className="community-page__badge">Traded with you</span>}
      </button>
    </li>
  )
}

interface FriendsPanelProps {
  query: string
  openedFriendName: string | null
  onChangeQuery: (query: string) => void
  onOpenFriend: (friend: Friend) => void
}

/** §9's in-app friends list, with the search filtering it live. */
function FriendsPanel({ query, openedFriendName, onChangeQuery, onOpenFriend }: FriendsPanelProps) {
  const friends = findFriends(query)

  return (
    <section className="page-section">
      <h2 className="page-section__heading">Friends</h2>

      <label className="community-page__label" htmlFor="community-friend-search">
        Search friends
      </label>
      <input
        id="community-friend-search"
        className="community-page__input"
        type="search"
        value={query}
        placeholder="Name, skill or place"
        onChange={(event) => onChangeQuery(event.target.value)}
      />

      <p className="community-page__count">
        {friends.length} of {MOCK_FRIENDS.length} friends
      </p>

      {friends.length === 0 ? (
        <p className="page-note">No friend matches that search.</p>
      ) : (
        <ul className="community-page__friends" aria-label="Friends">
          {friends.map((friend) => (
            <FriendRow key={friend.id} friend={friend} onOpen={() => onOpenFriend(friend)} />
          ))}
        </ul>
      )}

      {/* Tapping a friend is deliberately a labelled dead end. §7 only ever describes your own
          profile, the app has no route for somebody else's, and inventing one here would settle a
          screen the Appkarte never specifies. */}
      {openedFriendName !== null && (
        <p className="page-note" role="status">
          {openedFriendName}&apos;s profile would open here. The prototype has no page for another
          person&apos;s profile — §7 covers your own only — so this is where that link stops.
        </p>
      )}
    </section>
  )
}

interface BoardPanelProps {
  posts: BoardPost[]
  draft: string
  problem: string | null
  onChangeDraft: (draft: string) => void
  onPost: (event: FormEvent<HTMLFormElement>) => void
}

/** §9's "message board for community communication" — the whole description the card gives it. */
function BoardPanel({ posts, draft, problem, onChangeDraft, onPost }: BoardPanelProps) {
  return (
    <section className="page-section">
      <h2 className="page-section__heading">Message board</h2>

      <form className="community-page__composer" onSubmit={onPost}>
        <label className="community-page__label" htmlFor="community-post">
          New message
        </label>
        <textarea
          id="community-post"
          className="community-page__textarea"
          rows={3}
          value={draft}
          placeholder="Ask the neighbourhood for something, or offer something"
          onChange={(event) => onChangeDraft(event.target.value)}
        />

        {/* Reported on submit rather than by disabling the button: a disabled control can't say
            why it is disabled. Same call as the SkillsPage form. */}
        {problem !== null && (
          <p className="community-page__problem" role="alert">
            {problem}
          </p>
        )}

        <button type="submit" className="community-page__primary">
          Post
        </button>
      </form>

      <ul className="community-page__posts" aria-label="Message board">
        {posts.map((post) => (
          <li key={post.id} className="page-card community-page__post">
            <p className="community-page__post-head">
              <span aria-hidden="true">{post.avatar}</span>
              <span className="community-page__post-author">{post.author}</span>
              <span className="community-page__post-time">{post.time}</span>
            </p>
            <p className="community-page__post-text">{post.text}</p>
            <p className="community-page__post-replies">{replyLabel(post.replies)}</p>
          </li>
        ))}
      </ul>

      {/* Reply counts are in the mock data, so they are shown; a thread view is not. §9 describes
          the board in one clause and says nothing about replies, so opening one would be an
          invented screen rather than a built one. */}
      <p className="page-note">
        Reply counts are shown but threads don&apos;t open: §9 describes the board in one line and
        never says what a reply looks like.
      </p>
    </section>
  )
}

interface BlockedPanelProps {
  blocked: BlockedPerson[]
  onUnblock: (personId: string) => void
}

/** The view behind §9's blocked-persons button. */
function BlockedPanel({ blocked, onUnblock }: BlockedPanelProps) {
  return (
    <section className="page-section">
      <h2 className="page-section__heading">Blocked persons</h2>

      {blocked.length === 0 ? (
        <p className="page-note">Nobody is blocked.</p>
      ) : (
        <ul className="community-page__blocked" aria-label="Blocked persons">
          {blocked.map((person) => (
            <li key={person.id} className="page-card community-page__blocked-row">
              <span className="community-page__avatar" aria-hidden="true">
                {person.avatar}
              </span>
              <span className="community-page__blocked-text">
                <span className="community-page__friend-name">{person.name}</span>
                <span className="community-page__friend-meta">Blocked {person.blockedOn}</span>
              </span>
              <button
                type="button"
                className="community-page__secondary"
                aria-label={`Unblock ${person.name}`}
                onClick={() => onUnblock(person.id)}
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="page-note">
        §9 says only that a blocked-persons button exists. What blocking actually does — whether a
        blocked person can still see your ads, or you theirs — is not specified anywhere on the
        card, so this list is a list and nothing more.
      </p>
    </section>
  )
}

/** Community (Appkarte §9): the three things the card names — an in-app friends list, a
 *  blocked-persons button, and a message board for community communication.
 *
 *  Judgement calls:
 *  - The card calls blocked persons a *button*, not a section, so it is read here as a control
 *    that opens a separate view rather than a third tab beside Friends and Message board. It sits
 *    in PageShell's headerAction slot, next to the title, and swaps the page body while it is open.
 *  - Friends and the board share one segmented control (OptionGroup, as SearchPage does), because
 *    they are two full-height lists and a phone screen only has room for one of them at a time.
 *  - Tapping a friend, and opening a reply thread, are both labelled dead ends: neither screen is
 *    described anywhere in the Appkarte, so the page says so instead of inventing them.
 *  - Every piece of state lives here rather than in the panels, so switching tabs or opening the
 *    blocked list doesn't throw away a half-written post or a search you just typed.
 *
 *  §9 lists this page as decided but out of prototype scope; it is built now on request. Nothing
 *  persists — posting, unblocking and searching last until reload. */
export function CommunityPage() {
  const [view, setView] = useState<CommunityView>('friends')
  const [isBlockedListOpen, setIsBlockedListOpen] = useState(false)
  const [friendQuery, setFriendQuery] = useState('')
  const [openedFriendName, setOpenedFriendName] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<BlockedPerson[]>(MOCK_BLOCKED)
  const [posts, setPosts] = useState<BoardPost[]>(MOCK_BOARD_POSTS)
  const [draft, setDraft] = useState('')
  const [postProblem, setPostProblem] = useState<string | null>(null)

  const unblock = (personId: string) => {
    setBlocked((current) => current.filter((person) => person.id !== personId))
  }

  const publishPost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = draft.trim()

    if (text === '') {
      setPostProblem('Write something before posting.')
      return
    }

    setPosts((current) => [writePost(text, current.length), ...current])
    setDraft('')
    setPostProblem(null)
  }

  /** Any edit clears the complaint, so a fixed problem stops being complained about. */
  const editDraft = (next: string) => {
    setDraft(next)
    setPostProblem(null)
  }

  return (
    <PageShell
      title="Community"
      headerAction={
        <button
          type="button"
          className={`page-shell__action page-shell__action--text ${isBlockedListOpen ? 'is-active' : ''}`}
          aria-expanded={isBlockedListOpen}
          onClick={() => setIsBlockedListOpen((isOpen) => !isOpen)}
        >
          <span aria-hidden="true">🚫 </span>Blocked persons
        </button>
      }
    >
      <div className="community-page">
        {isBlockedListOpen ? (
          <BlockedPanel blocked={blocked} onUnblock={unblock} />
        ) : (
          <>
            <OptionGroup legend="View" options={VIEW_OPTIONS} selected={view} onSelect={setView} />

            {view === 'friends' ? (
              <FriendsPanel
                query={friendQuery}
                openedFriendName={openedFriendName}
                onChangeQuery={setFriendQuery}
                onOpenFriend={(friend) => setOpenedFriendName(friend.name)}
              />
            ) : (
              <BoardPanel
                posts={posts}
                draft={draft}
                problem={postProblem}
                onChangeDraft={editDraft}
                onPost={publishPost}
              />
            )}
          </>
        )}

        <p className="page-note">
          Nothing on this page is saved: posts, unblocks and searches last for this session only.
        </p>
      </div>
    </PageShell>
  )
}
