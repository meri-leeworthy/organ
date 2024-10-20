/// <reference types="vite/client" />

declare module "*?worker" {
  class WebWorker extends Worker {
    constructor()
  }

  export default WebWorker
}
