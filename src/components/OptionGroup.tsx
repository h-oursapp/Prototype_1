import './OptionGroup.css'

interface OptionGroupProps<T extends string | number | boolean> {
  legend: string
  options: { value: T; label: string }[]
  selected: T
  onSelect: (value: T) => void
}

/** A labeled row of mutually-exclusive choice buttons — used by the onboarding customize step
 *  and the Settings page so both stay in sync with a single look. `T` includes `boolean` for the
 *  plain yes/no toggles (TODO #9's "inventory scrollable") alongside the string/number choices
 *  (grid size, color theme, kind filter) it already served. */
export function OptionGroup<T extends string | number | boolean>({
  legend,
  options,
  selected,
  onSelect,
}: OptionGroupProps<T>) {
  return (
    <fieldset className="option-group">
      <legend>{legend}</legend>
      <div className="option-group__options">
        {options.map((option) => (
          <button
            // React's `key` type is string | number — String(...) covers the new boolean case
            // too, and is still unique for the existing string/number ones.
            key={String(option.value)}
            type="button"
            className={`option-group__option ${selected === option.value ? 'is-selected' : ''}`}
            aria-pressed={selected === option.value}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
