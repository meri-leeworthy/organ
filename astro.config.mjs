import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"

import tailwind from "@astrojs/tailwind"

export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    plugins: [wasm(), topLevelAwait()],
  },
  build: {
    target: "esnext",
  },
})
