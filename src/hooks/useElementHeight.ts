import { useCallback, useRef, useState } from 'react'

/** Measures a mounted element's own rendered height, live — for content whose height isn't a
 *  fixed design-time constant (it changes with its own children, e.g. collapsed vs. expanded),
 *  so a caller elsewhere in the layout can reserve real room for it instead of hand-picking a px
 *  number the way `DOTS_ALLOWANCE_PX` does (useFittingRows.ts).
 *
 *  A callback ref, not a plain `useRef` + a mount-time `useLayoutEffect` — the element this
 *  measures can be swapped for a *different* DOM node entirely while this hook's own owner stays
 *  mounted (TradeTableOverlay's collapsed `<div>` vs. its expanded `<section>` are two different
 *  host element types at the same JSX position, so React unmounts one and mounts the other on
 *  every toggle, rather than reusing one element). A one-time effect only ever measures whichever
 *  node was there at the very first mount; it has no way to notice the swap and never re-attaches
 *  its ResizeObserver to the replacement. A callback ref fires on every such swap (`null` on
 *  unmount, then the new node on mount), so re-attaching there is what stays correct across it. */
export function useElementHeight<T extends HTMLElement>() {
  const observerRef = useRef<ResizeObserver | null>(null)
  const [height, setHeight] = useState(0)

  const ref = useCallback((element: T | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null

    if (!element) {
      setHeight(0)
      return
    }

    const measure = () => setHeight(element.getBoundingClientRect().height)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    observerRef.current = observer
  }, [])

  return { ref, height }
}
