// This runs right after the DOM is parsed
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    console.log("[MutationObserver]", mutation)
  })
})

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
})

console.log("rendering iframe")
document.addEventListener("DOMContentLoaded", () => {
  console.log("dom content loaded")
  window.morphdomReady = false
  function loadScript(url, callback) {
    const script = document.createElement("script")
    script.src = url
    script.onload = callback
    document.head.appendChild(script)
  }

  loadScript(
    "https://cdn.jsdelivr.net/npm/morphdom/dist/morphdom-umd.min.js",
    () => {
      window.morphdomReady = true
    }
  )
})

window.addEventListener("message", event => {
  console.log("message received", event)
  try {
    if (event.data.type === "update") {
      if (document.readyState !== "complete") {
        console.warn("Skipping update, document not fully loaded yet.")
        return
      }
      if (!document.body) {
        console.log("document:", document)
        console.error("Morphdom update skipped: document.body is null")
        return
      }
      if (!event.data.html) {
        console.error("Morphdom update skipped: event.data.html is null")
        return
      }
      if (!window.morphdomReady) {
        console.warn("Morphdom not ready yet, update skipped")
        return
      }
      console.log("morphdom")
      morphdom(document.body, event.data.html, {
        childrenOnly: true,
      })
    } else if (event.data.type === "initialize") {
      window.morphdomReady = true
    }
  } catch (e) {
    console.error("Error during message", e)
  }
})
