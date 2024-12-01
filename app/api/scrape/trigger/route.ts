import { NextResponse } from 'next/server'
import { ScrapingService } from '@/lib/services/scraping-service'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const scraper = new ScrapingService();
    await scraper.initialize();
    
    const products = await scraper.scrapeProducts();
    
    return NextResponse.json({
      success: true,
      productsScraped: products.length,
      products: products.map(p => ({
        name: p.name,
        sku: p.sku,
        available: p.available,
        price: p.price
      }))
    });
  } catch (error) {
    console.error('Scraping failed:', error);
    return NextResponse.json(
      { error: 'Failed to scrape products' },
      { status: 500 }
    );
  }
} 