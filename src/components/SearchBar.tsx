import './SearchBar.css'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Names the field for assistive tech — also what tests find it by, so keep it stable per page
   *  rather than varying it with the placeholder. */
  ariaLabel?: string
}

/** A text field plus a small submit button next to it (TODO #13's "add a small search button to
 *  the right of the search bar"), first built for Search and reused as-is for Inventory (TODO #9)
 *  now that a second page wants the same bar — see FilterChip's own comment for why this pair of
 *  components exists instead of one more copy of the markup.
 *
 *  Filtering already happens live as `value` changes, so submitting doesn't do anything the typing
 *  hasn't already done — the button is there for discoverability and muscle memory (a search field
 *  "should" have one), not because submission triggers something typing didn't. */
export function SearchBar({ value, onChange, placeholder, ariaLabel = 'Search' }: SearchBarProps) {
  return (
    <form className="search-bar" role="search" onSubmit={(event) => event.preventDefault()}>
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
