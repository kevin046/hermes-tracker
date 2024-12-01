import { supabase } from '@/lib/supabase'
import { HermesScraper } from './hermes-scraper'

export class InventoryService {
  private scraper: HermesScraper;

  constructor() {
    this.scraper = new HermesScraper();
  }

  async updateInventory() {
    try {
      await this.scraper.initialize();
      const products = await this.scraper.getProducts();

      for (const product of products) {
        // Update or insert product
        const { data: existingProduct, error: productError } = await supabase
          .from('products')
          .upsert({
            sku: product.sku,
            name: product.name,
            category: product.category,
            price: product.price,
            currency: product.currency,
            color: product.color,
            material: product.material,
            size: product.size,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'sku',
            returning: true
          });

        if (productError) throw productError;

        // Update inventory status
        const { error: statusError } = await supabase
          .from('inventory_status')
          .upsert({
            product_id: existingProduct?.[0].id,
            available: Math.random() > 0.5, // Replace with actual availability check
            last_checked: new Date().toISOString()
          });

        if (statusError) throw statusError;
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    } finally {
      await this.scraper.close();
    }
  }
} 