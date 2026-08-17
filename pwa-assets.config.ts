import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates all the Android/iOS home-screen icons + favicon from one source
// image. Run with `npm run generate-pwa-assets` whenever public/favicon.svg
// changes. Output lands in public/ and is picked up by the manifest config
// in vite.config.ts.
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/favicon.svg'],
})
