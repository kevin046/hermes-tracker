import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeHermes, saveToSupabase } from '@/utils/scraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const products = await scrapeHermes();
    await saveToSupabase(products);
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ success: false, error: 'Scraping failed' });
  }
} 