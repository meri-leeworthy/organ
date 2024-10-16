# Local WASM SSG

This project aims to provide a simple way to build a static site with WebAssembly. It uses [Astro](https://astro.build) as the SSG and [WasmPack](https://rustwasm.github.io/wasm-pack/) to build the Rust WebAssembly module which processes markdown.

## Getting Started

To get started, clone this repository and run `npm install` to install the dependencies.

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
