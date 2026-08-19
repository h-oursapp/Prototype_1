import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates all the Android/iOS home-screen icons + favicon from one source image, writing every
// output *next to* that source — which is why the source has to live in public/ itself rather
// than some separate design/ folder, however tempting that separation sounds; this generator has
// no "write elsewhere" option; see https://vite-pwa-org.netlify.app/assets-generator for the full
// config. Run with `npm run generate-pwa-assets` whenever public/hours-logo-source.png changes.
//
// TODO #14: the source used to be public/favicon.svg, a hand-drawn vector. The real h_OURs logo
// (public/hours-logo-source.png) only exists as a raster export from the design tool that made
// it, so there's no vector to point this at anymore — sharp (which this generator uses
// internally) reads PNG input just as well as SVG, it just can't rasterize *up* past the source's
// own 519x518 resolution. That's still comfortably above every size this preset asks for (512px,
// the largest) — see index.html's own comment for what dropped out along with the vector.
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/hours-logo-source.png'],
})
