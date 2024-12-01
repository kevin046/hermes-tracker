'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Product {
  id: string;
  name: string;
  sku: string;
  available: boolean;
  last_checked: string;
}

export default function Home() {
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentProducts()
  }, [])

  const fetchRecentProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, available, last_checked')
        .order('last_checked', { ascending: false })
        .limit(3)

      if (error) throw error
      setRecentProducts(data || [])
    } catch (error) {
      console.error('Error fetching recent products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Hermes Inventory Tracker
        </h1>
        <p className="text-lg text-gray-600">
          Track Hermes bag availability in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Recent Updates</h2>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentProducts.map(product => (
                <div key={product.id} className="border p-4 rounded">
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  <p className={`text-sm ${product.available ? 'text-green-600' : 'text-red-600'}`}>
                    {product.available ? 'In Stock' : 'Out of Stock'}
                  </p>
                </div>
              ))}
              <Link 
                href="/inventory"
                className="inline-block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                View All Inventory
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Real-time inventory tracking
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Advanced filtering options
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Automatic updates every 6 hours
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
} 