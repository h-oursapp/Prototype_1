import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { CommunityPage } from '../../pages/CommunityPage'
import { renderWithRouter, stubMatchMedia } from '../helpers/renderWithRouter'

beforeEach(() => {
  window.localStorage.clear()
  stubMatchMedia()
})

function renderCommunityPage() {
  renderWithRouter(<CommunityPage />)
}

/** The board lives behind the segmented control, so every board test starts by switching to it. */
async function openMessageBoard(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Message board' }))
}

function boardPosts(): HTMLElement[] {
  return within(screen.getByRole('list', { name: 'Message board' })).getAllByRole('listitem')
}

describe('CommunityPage', () => {
  it('lists every friend with what they trade and where they are (§9)', () => {
    renderCommunityPage()

    const friends = within(screen.getByRole('list', { name: 'Friends' })).getAllByRole('listitem')
    expect(friends).toHaveLength(7)
    expect(screen.getByText('Lena K.')).toBeInTheDocument()
    expect(screen.getByText('Guitar lessons, amp repair')).toBeInTheDocument()
    expect(screen.getByText('Graz, AT')).toBeInTheDocument()
  })

  it('filters the friends list as you search, by name, skill or place', async () => {
    const user = userEvent.setup()
    renderCommunityPage()

    await user.type(screen.getByLabelText('Search friends'), 'bike')
    expect(screen.getByText('Tomas R.')).toBeInTheDocument()
    expect(screen.queryByText('Lena K.')).toBeNull()
    expect(screen.getByText('1 of 7 friends')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Search friends'))
    await user.type(screen.getByLabelText('Search friends'), 'Graz')
    expect(screen.getByText('Aisha M.')).toBeInTheDocument()
    expect(screen.queryByText('Tomas R.')).toBeNull()
  })

  it('says so when nothing matches instead of showing an empty list', async () => {
    const user = userEvent.setup()
    renderCommunityPage()

    await user.type(screen.getByLabelText('Search friends'), 'zzz')
    expect(screen.getByText('No friend matches that search.')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Friends' })).toBeNull()
  })

  it('marks tapping a friend as a dead end rather than inventing their profile page', async () => {
    const user = userEvent.setup()
    renderCommunityPage()

    await user.click(screen.getByRole('button', { name: "Open Lena K.'s profile" }))
    expect(screen.getByText(/Lena K\.'s profile would open here/)).toBeInTheDocument()
  })

  it('keeps the blocked list hidden until its button is pressed', async () => {
    const user = userEvent.setup()
    renderCommunityPage()

    expect(screen.queryByText('Spam Account')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Blocked persons' }))

    expect(screen.getByText('Anon U.')).toBeInTheDocument()
    expect(screen.getByText('Spam Account')).toBeInTheDocument()
    // The blocked list is a separate view, not a third tab beside Friends and Message board.
    expect(screen.queryByRole('list', { name: 'Friends' })).toBeNull()
  })

  it('unblocks one person and leaves the rest blocked', async () => {
    const user = userEvent.setup()
    renderCommunityPage()

    await user.click(screen.getByRole('button', { name: 'Blocked persons' }))
    await user.click(screen.getByRole('button', { name: 'Unblock Anon U.' }))

    expect(screen.queryByText('Anon U.')).toBeNull()
    expect(screen.getByText('Spam Account')).toBeInTheDocument()
  })

  it('returns to the friends list when the blocked button is pressed again', async () => {
    const user = userEvent.setup()
    renderCommunityPage()

    await user.click(screen.getByRole('button', { name: 'Blocked persons' }))
    await user.click(screen.getByRole('button', { name: 'Blocked persons' }))

    expect(screen.getByRole('list', { name: 'Friends' })).toBeInTheDocument()
    expect(screen.queryByText('Spam Account')).toBeNull()
  })

  it('shows the message board with its posts and reply counts', async () => {
    const user = userEvent.setup()
    renderCommunityPage()
    await openMessageBoard(user)

    expect(boardPosts()).toHaveLength(4)
    expect(screen.getByText(/Anyone have a ladder/)).toBeInTheDocument()
    expect(screen.getByText('3 replies')).toBeInTheDocument()
  })

  it('posts a new message to the top of the board and clears the input', async () => {
    const user = userEvent.setup()
    renderCommunityPage()
    await openMessageBoard(user)

    await user.type(screen.getByLabelText('New message'), 'Borrowing a drill on Saturday?')
    await user.click(screen.getByRole('button', { name: 'Post' }))

    const posts = boardPosts()
    expect(posts).toHaveLength(5)
    expect(posts[0]).toHaveTextContent('Borrowing a drill on Saturday?')
    expect(screen.getByLabelText('New message')).toHaveValue('')
  })

  it('rejects an empty or whitespace-only message and says why', async () => {
    const user = userEvent.setup()
    renderCommunityPage()
    await openMessageBoard(user)

    await user.click(screen.getByRole('button', { name: 'Post' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Write something before posting.')
    expect(boardPosts()).toHaveLength(4)

    await user.type(screen.getByLabelText('New message'), '   ')
    await user.click(screen.getByRole('button', { name: 'Post' }))
    expect(boardPosts()).toHaveLength(4)
  })

  it('keeps a posted message when you switch away and back', async () => {
    const user = userEvent.setup()
    renderCommunityPage()
    await openMessageBoard(user)

    await user.type(screen.getByLabelText('New message'), 'Spare paint, anyone?')
    await user.click(screen.getByRole('button', { name: 'Post' }))

    await user.click(screen.getByRole('button', { name: 'Friends' }))
    await openMessageBoard(user)

    expect(screen.getByText('Spare paint, anyone?')).toBeInTheDocument()
  })

  it('labels the reply thread as unbuilt rather than inventing one', async () => {
    const user = userEvent.setup()
    renderCommunityPage()
    await openMessageBoard(user)

    expect(screen.getByText(/threads don't open/i)).toBeInTheDocument()
  })
})
