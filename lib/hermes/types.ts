export interface HermesProduct {
  id: string
  name: string
  sku: string
  price: string
  currency: string
  available: boolean
  url: string
  imageUrl?: string
  category?: string
}

export interface HermesAPIResponse {
  success: boolean
  products: HermesProduct[]
  timestamp: string
  error?: string
}

export interface HermesAPIError extends Error {
  code: string
  status: number
} 