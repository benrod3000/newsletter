import '@testing-library/jest-dom/vitest'

/*
 * jsdom implements no layout and no matchMedia. GSAP's ScrollTrigger calls
 * matchMedia during `gsap.registerPlugin`, which runs at module-import time in
 * src/hooks/use-gsap.jsx - before any beforeAll hook - so any test that imports
 * a page using those hooks throws on collection without this.
 */
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() { return false },
  })
}
