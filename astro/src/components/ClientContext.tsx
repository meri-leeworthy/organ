import type { ReactNode } from "react"
import { Client } from "@/lib/Client"
import { createContext } from "react"
export const ClientContext = createContext<Client | null>(null)

// Create a singleton instance
const clientInstance = new Client()

export function ClientProvider({ children }: { children: ReactNode }) {
  if (typeof window === "undefined") {
    return <>{children}</>
  }

  return (
    <ClientContext.Provider value={clientInstance}>
      {children}
    </ClientContext.Provider>
  )
}
