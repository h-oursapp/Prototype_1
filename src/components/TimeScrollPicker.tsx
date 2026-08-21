import { useEffect, useRef, useState } from 'react'
import './TimeScrollPicker.css'

/** One pixel height per row — both columns below share it, so a scroll position converts to a
 *  row index with the same simple `scrollTop / ITEM_HEIGHT_PX` math either column uses. */
const ITEM_HEIGHT_PX = 28

/** TODO #11: "no need to save the minutes atm" — minutes exist so the picker has the two columns
 *  Márk asked for ("it should have a minutes side"), but nothing outside this component ever
 *  reads the value, so 5-minute steps are just a fixed list rather than anything configurable. */
const MINUTE_VALUES = Array.from({ length: 12 }, (_, index) => index * 5)

interface ScrollColumnProps {
  label: string
  values: number[]
  selected: number
  onSelect: (value: number) => void
}

/** One scrollable, snapping column of numbers — "scroll up and down to choose the correct amount"
 *  (Márk). Each row is a real `<button>`, not just a scroll target: tapping one jumps straight to
 *  it, which both gives keyboard/assistive-tech users a way in that a bare scroll gesture never
 *  would, and doubles as this component's easiest-to-test path (jsdom has no real scroll physics).
 *
 *  The list still scrolls too, for the "scroll" half of the ask: `handleScroll` converts whatever
 *  `scrollTop` lands on into the nearest row and reports it the same way a tap would. Re-assigning
 *  `scrollTop` from `selected` in the effect below is what keeps a tap (or an external change to
 *  `hours`) in sync with the scroll position — it's a no-op the rest of the time, since the user's
 *  own scroll gesture is what drove `selected` there in the first place, so it never fights their
 *  finger mid-scroll. */
function ScrollColumn({ label, values, selected, onSelect }: ScrollColumnProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const selectedIndex = values.indexOf(selected)

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      listRef.current.scrollTop = selectedIndex * ITEM_HEIGHT_PX
    }
  }, [selectedIndex])

  const handleScroll = () => {
    const list = listRef.current
    if (!list) return
    const index = Math.round(list.scrollTop / ITEM_HEIGHT_PX)
    const clampedIndex = Math.min(Math.max(index, 0), values.length - 1)
    const value = values[clampedIndex]
    if (value !== selected) onSelect(value)
  }

  return (
    <div className="time-scroll-picker__column" role="group" aria-label={label}>
      <div className="time-scroll-picker__list" ref={listRef} onScroll={handleScroll}>
        {values.map((value) => (
          <button
            key={value}
            type="button"
            className={`time-scroll-picker__row ${value === selected ? 'is-selected' : ''}`}
            aria-label={`${value} ${label.toLowerCase()}`}
            aria-current={value === selected ? 'true' : undefined}
            onClick={() => onSelect(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  )
}

export interface TimeScrollPickerProps {
  hours: number
  maxHours: number
  onChangeHours: (hours: number) => void
  /** "Delete it entirely" — same distinct action HoursStepper's own Remove button used to be,
   *  kept here rather than dropped: stepping the hours column to 0 still means "offering zero
   *  hours," not "no Time tile at all." */
  onRemove: () => void
  onClose: () => void
}

/** TODO #11: "when clicking on the time open a time picker within the grid cell... it should have
 *  a minutes side" — replaces the plain +/− HoursStepper. Built as a shared component from the
 *  start (not a TradingPage-only one) since Inventory's new trading-table overlay (TODO #9.1)
 *  needs the exact same control once hours become shared state (TradeDraftContext) — see
 *  tradeDraftContextInstance.ts's own comment.
 *
 *  "Within the grid cell" is read the same way FilterChip's own floating panel already is in this
 *  app (see FilterChip.tsx's doc comment): anchored to that one cell, not stuffed into its own
 *  square footprint — two scrolling columns plus their actions need more room than a single tile
 *  has. `.time-scroll-picker` is `position: absolute` by default (TimeScrollPicker.css) precisely
 *  so it can float over neighbouring cells instead of squeezing into one; the caller only has to
 *  wrap it in a `position: relative` cell, the same contract FilterChip's own panel already asks
 *  of its callers. */
export function TimeScrollPicker({ hours, maxHours, onChangeHours, onRemove, onClose }: TimeScrollPickerProps) {
  const hourValues = Array.from({ length: maxHours + 1 }, (_, index) => index)
  const [minutes, setMinutes] = useState(0)

  return (
    <div className="time-scroll-picker" role="group" aria-label="Choose the offered time">
      <div className="time-scroll-picker__columns">
        <ScrollColumn label="Hours" values={hourValues} selected={hours} onSelect={onChangeHours} />
        <span className="time-scroll-picker__separator" aria-hidden="true">
          :
        </span>
        <ScrollColumn label="Minutes" values={MINUTE_VALUES} selected={minutes} onSelect={setMinutes} />
      </div>

      <div className="time-scroll-picker__actions">
        <button type="button" className="time-scroll-picker__remove" onClick={onRemove}>
          Remove
        </button>
        <button type="button" className="time-scroll-picker__done" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}
