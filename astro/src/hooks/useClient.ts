import { useState, useEffect, useContext } from "react"

import type { UserData } from "@/lib/Client"
import { ClientContext } from "@/components/ClientContext"

export function useClient() {
  if (typeof window === "undefined") {
    return {
      userData: null,
      isLoggedIn: false,
      login: () => {},
      logout: () => {},
      changePassword: () => {},
      updateStorageRemaining: () => {},
      uploadFile: () => {},
      register: () => {},
      deleteFile: () => {},
      renameFile: () => Promise.resolve(undefined),
      requestPasswordReset: () => {},
      confirmEmail: () => {},
    }
  }

  const client = useContext(ClientContext)
  if (!client) {
    throw new Error("useClientContext must be used within a ClientProvider")
  }
  const [userData, setUserData] = useState<UserData | null>(client.userData)

  useEffect(() => {
    // Update userData when client.data changes
    setUserData(client.userData)
  }, [client.userData, client.isLoggedIn])

  const logout = async () => {
    await client.logout()
    setUserData(null)
  }

  return {
    userData,
    isLoggedIn: client.isLoggedIn,
    login: client.login.bind(client),
    logout: logout,
    changePassword: client.changePassword.bind(client),
    updateStorageRemaining: client.updateStorageRemaining.bind(client),
    uploadFile: client.uploadFile.bind(client),
    register: client.register.bind(client),
    deleteFile: client.deleteFile.bind(client),
    renameFile: client.renameFile.bind(client),
    requestPasswordReset: client.requestPasswordReset.bind(client),
    confirmEmail: client.confirmEmail.bind(client),
  }
}
