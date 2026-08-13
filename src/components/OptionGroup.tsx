import './OptionGroup.css'

interface OptionGroupProps<T extends string | number> {
  legend: string
  options: { value: T; label: string }[]
  selected: T
  onSelect: (value: T) => void
}

/** A labeled row of mutually-exclusive choice buttons — used by the onboarding customize step
 *  and the Settings page so both stay in sync with a single look. */
export function OptionGroup<T extends string | number>({ legend, options, selected, onSelect }: OptionGroupProps<T>) {
  return (
    <fieldset className="option-group">
      <legend>{legend}</legend>
      <div className="option-group__options">
        {options.map((option) => (
          <button
            key={option.value}
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
