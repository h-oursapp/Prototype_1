/** Was a vertical pointer drag from startY to endY an upward swipe past the threshold? */
export function isSwipeUp(startY: number, endY: number, thresholdPx = 40): boolean {
  return startY - endY >= thresholdPx
}
