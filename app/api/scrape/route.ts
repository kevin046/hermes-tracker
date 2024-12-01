import { NextResponse } from 'next/server'
import { ScrapingService } from '@/lib/services/scraping-service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scraper = new ScrapingService();
    await scraper.initialize();
    
    try {
      const products = await scraper.scrapeProducts();
      return NextResponse.json({ 
        success: true, 
        productsScraped: products.length 
      });
    } finally {
      await scraper.close();
    }
  } catch (error) {
    console.error('Error during scraping:', error);
    return NextResponse.json(
      { error: 'Failed to scrape inventory' },
      { status: 500 }
    );
  }
} 