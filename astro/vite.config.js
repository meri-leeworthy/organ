import { defineConfig } from "vite"

export default defineConfig({
  optimizeDeps: {
    exclude: ['@vector-im/matrix-wysiwyg'],
  },
  build: {
    target: "esnext",
    assetsInlineLimit: 0, // ensure WASM file isn't inlined
  },
  server: {
    fs: {
      // Allow serving files from node_modules
      allow: ['..']
    }
  }
})
