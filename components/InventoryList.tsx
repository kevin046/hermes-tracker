'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface Product {
  id: string;
  name: string;
  sku: string;
  price?: string;
  available: boolean;
  url: string;
  color?: string;
  material?: string;
  size?: string;
  region: string;
  image_url?: string;
  last_checked: string;
}

export default function InventoryList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    search: '',
    available: 'all',
    material: 'all',
    size: 'all'
  })

  useEffect(() => {
    fetchProducts()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('products_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('last_checked', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      product.sku.toLowerCase().includes(filter.search.toLowerCase()) ||
      product.color?.toLowerCase().includes(filter.search.toLowerCase()) ||
      product.material?.toLowerCase().includes(filter.search.toLowerCase());

    const matchesAvailability = 
      filter.available === 'all' || 
      (filter.available === 'inStock' && product.available) ||
      (filter.available === 'outOfStock' && !product.available);

    const matchesMaterial = 
      filter.material === 'all' || 
      product.material === filter.material;

    const matchesSize = 
      filter.size === 'all' || 
      product.size === filter.size;

    return matchesSearch && matchesAvailability && matchesMaterial && matchesSize;
  });

  const uniqueMaterials = Array.from(new Set(products.map(p => p.material).filter(Boolean)));
  const uniqueSizes = Array.from(new Set(products.map(p => p.size).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-8 space-y-4">
        <input
          type="text"
          placeholder="Search products..."
          value={filter.search}
          onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
          className="w-full px-4 py-2 border rounded-lg"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filter.available}
            onChange={(e) => setFilter(prev => ({ ...prev, available: e.target.value }))}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Availability</option>
            <option value="inStock">In Stock</option>
            <option value="outOfStock">Out of Stock</option>
          </select>

          <select
            value={filter.material}
            onChange={(e) => setFilter(prev => ({ ...prev, material: e.target.value }))}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Materials</option>
            {uniqueMaterials.map(material => (
              <option key={material} value={material}>{material}</option>
            ))}
          </select>

          <select
            value={filter.size}
            onChange={(e) => setFilter(prev => ({ ...prev, size: e.target.value }))}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Sizes</option>
            {uniqueSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="border p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
            {product.image_url && (
              <div className="relative h-48 mb-4">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            )}
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-gray-600">SKU: {product.sku}</p>
            {product.price && (
              <p className="text-green-600 font-medium">{product.price}</p>
            )}
            <p className={`inline-block px-2 py-1 rounded-full text-sm ${
              product.available 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {product.available ? 'In Stock' : 'Out of Stock'}
            </p>
            {product.color && (
              <p className="text-gray-600">Color: {product.color}</p>
            )}
            {product.material && (
              <p className="text-gray-600">Material: {product.material}</p>
            )}
            {product.size && (
              <p className="text-gray-600">Size: {product.size}</p>
            )}
            <div className="mt-4">
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View on Hermes →
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Last checked: {new Date(product.last_checked).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No products found matching your filters
        </div>
      )}
    </div>
  );
} 