import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeHermes, saveToSupabase } from '@/utils/scraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Starting scrape request...');
    
    const products = await scrapeHermes();
    console.log(`Scraped ${products.length} products`);

    if (!products || products.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No products found' 
      });
    }

    const savedData = await saveToSupabase(products);
    
    res.status(200).json({ 
      success: true, 
      products,
      savedData 
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
} 