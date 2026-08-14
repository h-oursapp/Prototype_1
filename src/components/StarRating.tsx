import './StarRating.css'

export const MAX_STARS = 5

interface StarRatingProps {
  /** 0–5, per Appkarte §7 and §8. */
  value: number
  /** What is being rated, e.g. a skill or a person's name. It goes into the accessible name, so
   *  several ratings on one page stay tellable apart by a screen reader. */
  subject: string
}

/** A read-only star rating. The glyphs are hidden from assistive tech and the number is spelled
 *  out in the label instead — "★★★★☆" read aloud is noise, "rated 4 out of 5" is the fact.
 *
 *  This is display only. The Final Review page (§8) needs a rating the user can *set*, which is
 *  a radio group rather than an image, so it stays a separate component there. */
export function StarRating({ value, subject }: StarRatingProps) {
  return (
    <span className="star-rating" role="img" aria-label={`${subject}: rated ${value} out of ${MAX_STARS}`}>
      <span aria-hidden="true">
        {'★'.repeat(value)}
        {'☆'.repeat(MAX_STARS - value)}
      </span>
    </span>
  )
}
