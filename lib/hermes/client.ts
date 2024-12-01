import { HermesProduct, HermesAPIResponse, HermesAPIError } from './types'

class HermesClient {
  private baseUrl: string
  private apiKey: string
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

  constructor() {
    this.baseUrl = process.env.HERMES_API_URL || 'https://www.hermes.com'
    this.apiKey = process.env.HERMES_API_KEY || ''
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'User-Agent': this.userAgent,
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.hermes.com',
      'Origin': 'https://www.hermes.com',
      ...options.headers,
    }

    // Add random delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))

    try {
      const response = await fetch(url, { 
        ...options, 
        headers,
        credentials: 'include',
      })
      
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

  async getProductUrl(sku: string): Promise<string> {
    return `https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/bags-and-clutches/#|`
  }

  async getInventory(category?: string): Promise<HermesProduct[]> {
    // For now, return mock data to avoid getting blocked
    return [
      {
        id: '1',
        name: 'Birkin 25',
        sku: 'BK25-TOGO-NOIR',
        price: '10000',
        currency: 'USD',
        available: Math.random() > 0.5,
        url: await this.getProductUrl('BK25-TOGO-NOIR'),
        category: 'Bags',
      },
      {
        id: '2',
        name: 'Kelly 28',
        sku: 'K28-EPSOM-GOLD',
        price: '9000',
        currency: 'USD',
        available: Math.random() > 0.5,
        url: await this.getProductUrl('K28-EPSOM-GOLD'),
        category: 'Bags',
      },
    ]
  }
}

export const hermesClient = new HermesClient() 