import { useCallback, useEffect, useState } from 'react'

/** Appkarte §3: away from Home the nav bar collapses into a floating corner button after a
 *  timer, and tapping that button brings it back.
 *
 *  `enabled` is false on Home, where the bar is permanently open — so the timer never runs there
 *  and the bar can't end up collapsed.
 *
 *  Any interaction with the open bar calls `keepOpen`, which restarts the countdown so the bar
 *  can't disappear out from under a finger mid-tap. */
export function useAutoCollapse(enabled: boolean, delayMs = 4000) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  // Bumping this restarts the timer without otherwise changing what's rendered.
  const [timerNonce, setTimerNonce] = useState(0)

  const expand = useCallback(() => {
    setIsCollapsed(false)
    setTimerNonce((nonce) => nonce + 1)
  }, [])

  const keepOpen = useCallback(() => setTimerNonce((nonce) => nonce + 1), [])

  useEffect(() => {
    if (!enabled || isCollapsed) return

    const timer = setTimeout(() => setIsCollapsed(true), delayMs)
    return () => clearTimeout(timer)
  }, [enabled, isCollapsed, delayMs, timerNonce])

  return { isCollapsed: enabled && isCollapsed, expand, keepOpen }
}
