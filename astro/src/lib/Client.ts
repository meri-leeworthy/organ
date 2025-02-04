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

  private async fetchWithCors(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
      mode: "cors",
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || response.statusText)
    }

    return response
  }

  async login(email: string, password: string): Promise<void> {
    const response = await this.fetchWithCors(API_BASE_URL + "login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    const { jwt, refresh_token: refreshToken } = await response.json()
    this.jwt = jwt
    this.refreshToken = refreshToken

    console.log("jwt: ", jwt)
    console.log("refreshToken: ", refreshToken)

    // Fetch user data using the JWT
    const userResponse = await this.fetchWithCors(API_BASE_URL + "user", {
      headers: { Authorization: `Bearer ${jwt}` },
    })

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
      await this.fetchWithCors(API_BASE_URL + "logout", {
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
    if (!this.jwt) throw new Error("Not logged in")

    await this.fetchWithCors(API_BASE_URL + "password/change", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  async refreshJWT(): Promise<void> {
    if (!this.refreshToken) throw new Error("No refresh token available")

    const response = await this.fetchWithCors(API_BASE_URL + "token/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    })

    const { jwt, refreshToken } = await response.json()
    this.jwt = jwt
    this.refreshToken = refreshToken
    this.save()
  }

  async updateStorageRemaining(): Promise<void> {
    if (!this.jwt) throw new Error("Not logged in")

    // We'll use the upload endpoint with a zero-size request to get storage info
    const response = await this.fetchWithCors(
      API_BASE_URL + "upload?file=dummy&size=0",
      {
        headers: { Authorization: `Bearer ${this.jwt}` },
      }
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
      type: file.type,
    })
    if (!this.jwt) throw new Error("Not logged in")

    // Get presigned URL
    console.log("Requesting presigned URL for:", {
      fileName,
      size: file.size,
      type: file.type,
    })
    const response = await this.fetchWithCors(
      API_BASE_URL +
        `upload?file=${encodeURIComponent(fileName)}&size=${file.size}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${this.jwt}` },
      }
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
