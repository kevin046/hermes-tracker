'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

type InventoryItem = {
  id: string
  product_name: string
  sku: string
  available: boolean
  price: string
  currency: string
  url: string
  image_url?: string
  category?: string
  last_checked: string
}

export default function InventoryList() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchInventory()
    
    const channel = supabase
      .channel('inventory_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory' },
        () => {
          fetchInventory()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('last_checked', { ascending: false })

      if (error) throw error
      setInventory(data || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventory.filter(item =>
    item.product_name.toLowerCase().includes(filter.toLowerCase()) ||
    item.sku.toLowerCase().includes(filter.toLowerCase()) ||
    (item.category?.toLowerCase() || '').includes(filter.toLowerCase())
  )

  if (loading) {
    return <div>Loading inventory...</div>
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-2 border rounded-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInventory.map((item) => (
          <div
            key={item.id}
            data-testid="inventory-item"
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            {item.image_url && (
              <div className="relative h-48 mb-4">
                <Image
                  src={item.image_url}
                  alt={item.product_name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            )}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{item.product_name}</h3>
                <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                {item.category && (
                  <p className="text-sm text-gray-500">Category: {item.category}</p>
                )}
                <p className="text-sm font-medium mt-2">
                  {item.price} {item.currency}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-sm ${
                  item.available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {item.available ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            <div className="mt-4">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View on Hermes →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 