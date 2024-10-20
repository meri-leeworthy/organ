import React from "react"
import { SqlProvider } from "./SqlContext"
import { TwoColumnLayout } from "./TwoColumnLayout"

const App: React.FC = () => {
  return (
    <SqlProvider>
      <TwoColumnLayout />
    </SqlProvider>
  )
}

export default App
