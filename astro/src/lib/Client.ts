import { API_BASE_URL } from "./consts"

export interface UserData {
  email?: string
  name?: string
  state: "unconfirmed" | "free"
  storageRemaining: number
}

const defaultUserData: UserData = {
  state: "unconfirmed",
  storageRemaining: 0,
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
      ...parsedResponse,
      name: parsedResponse.metadata.name,
      storageRemaining: 1000000000 - parsedResponse.storage_used,
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

  async uploadFile(file: Blob, fileName: string, mimeType: string) {
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
      const url = "https://static.organ.is" + parsedPresignedUrl.pathname
      return url
    } catch (error) {
      console.error("Upload error:", error)
      throw error
    }
  }
}
