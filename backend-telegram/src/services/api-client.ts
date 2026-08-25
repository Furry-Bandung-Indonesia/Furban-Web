import type { Bindings } from '../types'
import { AuthService } from './auth'

export class ApiClient {
  private authService: AuthService

  constructor(private env: Bindings) {
    this.authService = new AuthService(env)
  }

  /**
   * Make an HTTP request to backend-auth
   */
  async auth(method: string, path: string, body?: any): Promise<any> {
    const token = await this.authService.getServiceToken()
    const url = `${this.env.AUTH_SERVICE_URL}${path}`

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      options.body = JSON.stringify(body)
    }

    const res = await fetch(url, options)
    const json = (await res.json().catch(() => ({ message: `HTTP ${res.status} ${res.statusText}` }))) as any

    if (!res.ok) {
      const errorMsg = json.message || `Request failed with status ${res.status}`
      throw new Error(errorMsg)
    }

    return json
  }

  /**
   * Make an HTTP request to backend-ticketing
   */
  async ticketing(method: string, path: string, body?: any): Promise<any> {
    const token = await this.authService.getServiceToken()
    const url = `${this.env.TICKETING_SERVICE_URL}${path}`

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      options.body = JSON.stringify(body)
    }

    const res = await fetch(url, options)
    const json = (await res.json().catch(() => ({ message: `HTTP ${res.status} ${res.statusText}` }))) as any

    if (!res.ok) {
      const errorMsg = json.message || `Request failed with status ${res.status}`
      throw new Error(errorMsg)
    }

    return json
  }

  /**
   * Make a multipart/form-data upload to backend-ticketing (for event banners)
   */
  async ticketingUpload(method: string, path: string, formData: FormData): Promise<any> {
    const token = await this.authService.getServiceToken()
    const url = `${this.env.TICKETING_SERVICE_URL}${path}`

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      // Note: do not set Content-Type header manually for FormData, fetch sets boundary
    }

    const res = await fetch(url, {
      method,
      headers,
      body: formData,
    })

    const json = (await res.json().catch(() => ({ message: `HTTP ${res.status} ${res.statusText}` }))) as any

    if (!res.ok) {
      const errorMsg = json.message || `Upload failed with status ${res.status}`
      throw new Error(errorMsg)
    }

    return json
  }
}
