export interface Subscriber {
  id: string
  email: string
  created_at: string
}

export interface InventoryItem {
  id: string
  product_name: string
  sku: string
  available: boolean
  last_checked: string
} 