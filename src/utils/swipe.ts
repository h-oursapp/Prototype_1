/** Was a vertical pointer drag from startY to endY an upward swipe past the threshold? */
export function isSwipeUp(startY: number, endY: number, thresholdPx = 40): boolean {
  return startY - endY >= thresholdPx
}

/** Was a horizontal pointer drag from startX to endX a rightward swipe (dragged left-to-right)
 *  past the threshold? Home pairs this with opening Your offers (TODO #3). */
export function isSwipeRight(startX: number, endX: number, thresholdPx = 40): boolean {
  return endX - startX >= thresholdPx
}

/** Was a horizontal pointer drag from startX to endX a leftward swipe (dragged right-to-left)
 *  past the threshold? Home pairs this with opening Search (TODO #3). */
export function isSwipeLeft(startX: number, endX: number, thresholdPx = 40): boolean {
  return startX - endX >= thresholdPx
}
