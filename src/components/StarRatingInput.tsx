import './StarRatingInput.css'

/** Appkarte §8: ratings run 0–5★, so zero is a real choice and not just "nothing picked yet". */
const RATING_VALUES = [0, 1, 2, 3, 4, 5]

interface StarRatingInputProps {
  /** Names the group and prefixes each star's accessible name — keeps several pickers on one
   *  page tellable apart (e.g. Final Review's skill vs. personal rating). */
  label: string
  /** Groups the radios in the DOM — must be unique per picker on the page. */
  name: string
  value: number
  onChange: (value: number) => void
}

/** A 0–5★ rating picker built from real radio inputs: the browser handles arrow-key selection and
 *  group semantics for free, and every star carries its number in its accessible name instead of
 *  being a bare glyph a screen reader can't read out.
 *
 *  Originally Final Review's own "set a rating" control (§8); Search's minimum-rating filter
 *  (TODO #13) wants the identical picker rather than a lookalike, so it moved here once there
 *  were two real callers. */
export function StarRatingInput({ label, name, value, onChange }: StarRatingInputProps) {
  return (
    <fieldset className="star-rating-input">
      <legend>{label}</legend>
      <div className="star-rating-input__stars">
        {RATING_VALUES.map((rating) => (
          <label key={rating} className={`star-rating-input__star ${rating <= value ? 'is-active' : ''}`}>
            <input
              type="radio"
              name={name}
              checked={rating === value}
              onChange={() => onChange(rating)}
              aria-label={`${label}: Rate ${rating} out of 5`}
            />
            <span aria-hidden="true">{rating === 0 ? '0' : '★'}</span>
          </label>
        ))}
      </div>
      <p className="star-rating-input__value">{value} of 5</p>
    </fieldset>
  )
}
