import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useElementHeight } from '../../hooks/useElementHeight'

/** Same idea as useFittingRows.test.tsx's own probe: renders the measured height as text, using
 *  whatever `getBoundingClientRect` the test has stubbed onto the ref'd element beforehand. */
function ElementHeightProbe() {
  const { ref, height } = useElementHeight<HTMLDivElement>()
  return (
    <div ref={ref}>
      <p>Height: {height}</p>
    </div>
  )
}

/** Stands in for TradeTableOverlay's own collapsed-`<div>`-vs-expanded-`<section>` swap: two
 *  different host element types at the same JSX position, so re-rendering with a different
 *  `asSection` flips which one React mounts, tearing the old one down rather than reusing it. */
function SwappableElementHeightProbe({ asSection }: { asSection: boolean }) {
  const { ref, height } = useElementHeight<HTMLElement>()
  const body = <p>Height: {height}</p>
  return asSection ? <section ref={ref}>{body}</section> : <div ref={ref}>{body}</div>
}

describe('useElementHeight', () => {
  it('reports 0 before any real layout exists, as in jsdom', () => {
    render(<ElementHeightProbe />)

    expect(screen.getByText('Height: 0')).toBeInTheDocument()
  })

  it('reports the element\'s own measured height once layout is real', () => {
    const getBoundingClientRect = () => ({ height: 212 }) as DOMRect

    // jsdom's default is a real (if inert) getBoundingClientRect, always {0,0,0,0} — replacing it
    // on the prototype for this one test is what stands in for "the browser actually laid this
    // out", without needing a real browser (see CLAUDE.md: skip visual/browser testing).
    const original = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = getBoundingClientRect

    try {
      render(<ElementHeightProbe />)

      expect(screen.getByText('Height: 212')).toBeInTheDocument()
    } finally {
      HTMLElement.prototype.getBoundingClientRect = original
    }
  })

  it('re-measures the replacement element once the ref lands on a different host element type, not just the first one it saw', () => {
    // Regression test for a real bug: an earlier version measured once via a plain `useRef` and a
    // mount-time `useLayoutEffect` with no dependencies — correct for a node that resizes in
    // place, but blind to one swapped out for a *different* element entirely (a <div> replaced by
    // a <section> at the same JSX spot, exactly what TradeTableOverlay's collapsed/expanded swap
    // does): the effect never re-ran, so the ResizeObserver kept "observing" a node no longer in
    // the document, and the reported height silently froze rather than tracking the replacement.
    const original = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      return { height: this.tagName === 'SECTION' ? 300 : 100 } as DOMRect
    }

    try {
      const { rerender } = render(<SwappableElementHeightProbe asSection={false} />)
      expect(screen.getByText('Height: 100')).toBeInTheDocument()

      rerender(<SwappableElementHeightProbe asSection={true} />)
      expect(screen.getByText('Height: 300')).toBeInTheDocument()

      rerender(<SwappableElementHeightProbe asSection={false} />)
      expect(screen.getByText('Height: 100')).toBeInTheDocument()
    } finally {
      HTMLElement.prototype.getBoundingClientRect = original
    }
  })
})
