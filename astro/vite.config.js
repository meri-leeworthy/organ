import { defineConfig } from "vite"

export default defineConfig({
  build: {
    target: "esnext",
    assetsInlineLimit: 0, // ensure WASM file isn't inlined
  },
})
