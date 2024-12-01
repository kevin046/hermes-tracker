import { hermesClient } from '@/lib/hermes/client'
import { supabase } from '@/lib/supabase'
import { checkAndNotify } from '@/lib/notifications'

const HERMES_BASE_URL = 'https://www.hermes.com/us/en';

export async function syncInventory() {
  try {
    // Fetch latest inventory from Hermes
    const products = await hermesClient.getInventory()

    // Update inventory in database
    for (const product of products) {
      const { error } = await supabase
        .from('inventory')
        .upsert(
          {
            product_name: product.name,
            sku: product.sku,
            available: product.available,
            price: product.price,
            currency: product.currency,
            url: product.url || `${HERMES_BASE_URL}/search/?s=${encodeURIComponent(product.sku)}`,
            image_url: product.imageUrl,
            category: product.category,
            last_checked: new Date().toISOString(),
          },
          { onConflict: 'sku' }
        )

      if (error) throw error
    }

    // Check for changes and send notifications if needed
    await checkAndNotify()

    return { success: true, productsUpdated: products.length }
  } catch (error) {
    console.error('Error syncing inventory:', error)
    throw error
  }
} 