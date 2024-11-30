import { HermesProduct, HermesAPIResponse, HermesAPIError } from './types'

class HermesClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.HERMES_API_URL || 'https://api.hermes.com'
    this.apiKey = process.env.HERMES_API_KEY || ''
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    try {
      const response = await fetch(url, { ...options, headers })
      
      if (!response.ok) {
        const error: HermesAPIError = new Error('API request failed') as HermesAPIError
        error.code = response.statusText
        error.status = response.status
        throw error
      }

      return response.json()
    } catch (error) {
      console.error('Hermes API request failed:', error)
      throw error
    }
  }

  async getInventory(category?: string): Promise<HermesProduct[]> {
    const endpoint = category 
      ? `/inventory?category=${encodeURIComponent(category)}`
      : '/inventory'
      
    const response = await this.request<HermesAPIResponse>(endpoint)
    return response.products
  }

  async getProduct(sku: string): Promise<HermesProduct> {
    const endpoint = `/products/${encodeURIComponent(sku)}`
    const response = await this.request<HermesProduct>(endpoint)
    return response
  }
}

export const hermesClient = new HermesClient() 