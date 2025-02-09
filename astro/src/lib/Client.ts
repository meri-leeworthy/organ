import { toast } from "sonner"
import { API_BASE_URL } from "./consts"

export interface UserData {
  email: string
  username?: string
  state: string
  storageUsed: number
  storageRemaining: number
  metadata: any
}

const defaultUserData: UserData = {
  email: "",
  state: "unconfirmed",
  storageUsed: 0,
  storageRemaining: 0,
  metadata: {},
}

export class Client {
  private data: UserData = defaultUserData
  private jwt: string | null = null
  private refreshToken: string | null = null
  private isRefreshing = false
  private refreshPromise: Promise<void> | null = null

  constructor() {
    if (typeof window === "undefined") return
    // Load data from localStorage
    const storedData = localStorage.getItem("userData")
    const storedJwt = localStorage.getItem("jwt")
    const storedRefreshToken = localStorage.getItem("refreshToken")

    if (storedData) this.data = JSON.parse(storedData)
    if (storedJwt) this.jwt = storedJwt
    if (storedRefreshToken) this.refreshToken = storedRefreshToken
  }

  get isLoggedIn(): boolean {
    return !!this.jwt
  }

  get userData(): UserData | null {
    return this.data
  }

  get token(): string | null {
    return this.jwt
  }

  private save() {
    if (this.data) localStorage.setItem("userData", JSON.stringify(this.data))
    if (this.jwt) localStorage.setItem("jwt", this.jwt)
    if (this.refreshToken)
      localStorage.setItem("refreshToken", this.refreshToken)
  }

  private clear() {
    console.log("clearing data")
    this.data = defaultUserData
    this.jwt = null
    this.refreshToken = null
    localStorage.removeItem("userData")
    localStorage.removeItem("jwt")
    localStorage.removeItem("refreshToken")
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<Response> {
    try {
      // Add Authorization header if we have a token
      if (this.jwt) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${this.jwt}`,
        }
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        credentials: "include",
        mode: "cors",
      })

      // If the response is 401 and we haven't retried yet, attempt to refresh the token
      if (response.status === 401 && !isRetry) {
        try {
          await this.refreshTokenIfNeeded()
          // Retry the original request with the new token
          return this.fetchWithRetry(url, options, true)
        } catch (error) {
          console.error("Token refresh failed:", error)
          this.clear() // Clear all auth data if refresh fails
          throw new Error("Authentication expired. Please log in again.")
        }
      }

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || response.statusText)
      }

      return response
    } catch (error) {
      console.error("Fetch error:", error)
      throw error
    }
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    // If we're already refreshing, wait for that to complete
    if (this.isRefreshing) {
      return this.refreshPromise!
    }

    // If we don't have a refresh token, we can't refresh
    if (!this.refreshToken) {
      throw new Error("No refresh token available")
    }

    try {
      this.isRefreshing = true
      this.refreshPromise = this.refreshJWT()
      await this.refreshPromise
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  async login(email: string, password: string): Promise<void> {
    const response = await this.fetchWithRetry(API_BASE_URL + "login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    const { jwt, refresh_token: refreshToken } = await response.json()
    this.jwt = jwt
    this.refreshToken = refreshToken

    // Fetch user data using the JWT
    const userResponse = await this.fetchWithRetry(API_BASE_URL + "user")

    const parsedResponse = await userResponse.json()

    this.data = {
      email: parsedResponse.email,
      username: parsedResponse.username,
      state: parsedResponse.state,
      storageUsed: parsedResponse.storage_used,
      storageRemaining: 1000000000 - parsedResponse.storage_used,
      metadata: parsedResponse.metadata,
    }

    this.save()
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const response = await this.fetchWithRetry(API_BASE_URL + "register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        metadata: {
          name,
        },
      }),
    })

    const { jwt, refresh_token: refreshToken } = await response.json()
    this.jwt = jwt
    this.refreshToken = refreshToken

    // Set initial user data
    this.data = {
      email,
      username: name,
      state: "unconfirmed",
      storageUsed: 0,
      storageRemaining: 1000000000, // 1GB default
      metadata: {
        name,
      },
    }

    this.save()
  }

  async logout(): Promise<void> {
    console.log("Client logging out")
    if (!this.refreshToken) return

    try {
      await this.fetchWithRetry(API_BASE_URL + "logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      })
    } finally {
      console.log("clearing")
      this.clear()
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await this.fetchWithRetry(API_BASE_URL + "password/change", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  async getUser(): Promise<UserData> {
    const response = await this.fetchWithRetry(API_BASE_URL + "user")
    const parsedResponse = await response.json()

    this.data = {
      email: parsedResponse.email,
      username: parsedResponse.username,
      state: parsedResponse.state,
      storageUsed: parsedResponse.storage_used,
      storageRemaining: 1000000000 - parsedResponse.storage_used,
      metadata: parsedResponse.metadata,
    }

    this.save()
    return this.data
  }

  private async refreshJWT(): Promise<void> {
    if (!this.refreshToken) throw new Error("No refresh token available")

    const response = await fetch(API_BASE_URL + "token/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: this.refreshToken }),
      credentials: "include",
      mode: "cors",
    })

    if (!response.ok) {
      throw new Error("Failed to refresh token")
    }

    const { jwt, refresh_token: newRefreshToken } = await response.json()
    this.jwt = jwt
    this.refreshToken = newRefreshToken
    this.save()
  }

  async updateStorageRemaining(): Promise<void> {
    const response = await this.fetchWithRetry(
      API_BASE_URL + "upload?file=dummy&size=0"
    )

    const { remaining_storage } = await response.json()
    if (this.data) {
      this.data.storageRemaining = remaining_storage
      this.save()
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.fetchWithRetry(API_BASE_URL + "password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<void> {
    await this.fetchWithRetry(API_BASE_URL + "password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    })
  }

  async confirmEmail(token: string): Promise<void> {
    await this.fetchWithRetry(API_BASE_URL + "confirm-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    })

    // Update user state after confirmation
    if (this.data) {
      this.data.state = "free"
      this.save()
    }
  }

  async uploadFile(file: Blob, fileName: string, mimeType: string) {
    if (!this.data || !this.data.username) {
      toast.error("No user data available")
      throw new Error("No user data available")
    }

    console.log("Uploading file:", {
      fileName,
      size: file.size,
      mime: mimeType,
    })

    // Get presigned URL
    console.log("Requesting presigned URL for:", {
      fileName,
      size: file.size,
      mime: mimeType,
    })
    const response = await this.fetchWithRetry(
      API_BASE_URL +
        `upload?file=${encodeURIComponent(fileName)}&size=${file.size}&mime=${encodeURIComponent(mimeType)}`
    )

    const { presigned_url } = await response.json()
    console.log("Got presigned URL:", presigned_url)

    // Upload to R2 using presigned URL
    try {
      const uploadResponse = await fetch(presigned_url, {
        method: "PUT",
        body: file,
        mode: "cors",
        headers: {
          "Content-Type": mimeType,
        },
      })

      console.log("R2 response:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
      })

      if (!uploadResponse.ok) {
        const text = await uploadResponse.text()
        console.error("Upload failed:", text)
        throw new Error(
          `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} ${text}`
        )
      }

      const parsedPresignedUrl = new URL(presigned_url)
      const fileId = parsedPresignedUrl.pathname.split("/")[2]
      const url = `http://${this.data.username}.on.organ.is/${fileId}`
      return url
    } catch (error) {
      console.error("Upload error:", error)
      throw error
    }
  }

  async deleteFile(url: string): Promise<void> {
    // Extract the file path from the URL
    // URL format is http://{userId}.on.organ.is/{fileId}
    const urlObj = new URL(url)
    const userId = urlObj.hostname.split(".")[0]
    const fileId = urlObj.pathname.substring(1) // Remove leading slash
    const filePath = `${userId}/${fileId}`

    await this.fetchWithRetry(
      API_BASE_URL + `file?path=${encodeURIComponent(filePath)}`,
      {
        method: "DELETE",
      }
    )
  }

  async renameFile(
    oldUrl: string,
    newFileName: string
  ): Promise<string | undefined> {
    try {
      // Extract the file path from the URL
      // URL format is http://{userId}.on.organ.is/{fileId}
      const urlObj = new URL(oldUrl)
      const userId = urlObj.hostname.split(".")[0]
      const oldFileId = urlObj.pathname.substring(1) // Remove leading slash
      const oldPath = `${userId}/${oldFileId}`

      // Generate new file ID from the new filename
      const newFileId = encodeURIComponent(newFileName)
      const newPath = `${userId}/${newFileId}`

      await this.fetchWithRetry(
        API_BASE_URL +
          `file/rename?old_path=${encodeURIComponent(oldPath)}&new_path=${encodeURIComponent(newPath)}`,
        {
          method: "PUT",
        }
      )

      // Return the new URL
      return `http://${userId}.on.organ.is/${newFileId}`
    } catch (error) {
      console.error("Error in renameFile:", error)
      return undefined
    }
  }
}
