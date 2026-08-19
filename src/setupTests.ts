import '@testing-library/jest-dom'

/** jsdom has no ResizeObserver, and never lays anything out in the first place — so `useFittingRows`
 *  (src/hooks/useFittingRows.ts) has nothing real to observe here regardless. This stub exists only
 *  so `new ResizeObserver(...)` doesn't throw; no test relies on it ever firing. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}
