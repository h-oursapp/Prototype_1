import './SearchBar.css'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Names the field for assistive tech — also what tests find it by, so keep it stable per page
   *  rather than varying it with the placeholder. */
  ariaLabel?: string
  /** Called on submit (Enter, or the button) — optional because most callers (Inventory, Search's
   *  own bar) filter live as `value` changes and have nothing extra to do on submit. Home's bar
   *  (TODO #3) is the exception: submitting there is what navigates to the full Search page. */
  onSubmit?: () => void
  /** Shrinks the field and button — for a spot with less room to spare than Search's or
   *  Inventory's own full-width bar, like Home's topbar (TODO #3) sitting inline with the logo.
   *  Same idea as PageShell's `compactTitle`. */
  compact?: boolean
}

/** A text field plus a small submit button next to it (TODO #13's "add a small search button to
 *  the right of the search bar"), first built for Search and reused as-is for Inventory (TODO #9)
 *  now that a second page wants the same bar — see FilterChip's own comment for why this pair of
 *  components exists instead of one more copy of the markup.
 *
 *  Filtering already happens live as `value` changes, so for most callers submitting doesn't do
 *  anything the typing hasn't already done — the button is there for discoverability and muscle
 *  memory (a search field "should" have one). `onSubmit` is only for the caller that does need it
 *  (see its own doc comment). */
export function SearchBar({
  value,
  onChange,
  placeholder,
  ariaLabel = 'Search',
  onSubmit,
  compact = false,
}: SearchBarProps) {
  return (
    <form
      className={`search-bar ${compact ? 'search-bar--compact' : ''}`}
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}
    >
      <input
        className="search-bar__field"
        type="search"
        aria-label={ariaLabel}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="submit" className="search-bar__submit" aria-label="Submit search">
        <span aria-hidden="true">🔍</span>
      </button>
    </form>
  )
}
