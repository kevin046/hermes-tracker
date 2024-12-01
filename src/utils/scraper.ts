import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createClient } from '@supabase/supabase-js';

puppeteer.use(StealthPlugin());

interface Product {
  name: string;
  price: string;
  url: string;
  availability: string;
}

export async function scrapeHermes(): Promise<Product[]> {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to Hermès
    await page.goto('https://www.hermes.com/ca/en/category/women/bags-and-small-leather-goods/bags-and-clutches/#|', {
      waitUntil: 'networkidle0'
    });

    // Wait for product grid to load
    await page.waitForSelector('.product-grid-item'); // Adjust selector based on actual HTML

    const products = await page.evaluate(() => {
      const items = document.querySelectorAll('.product-grid-item');
      return Array.from(items).map((item) => {
        return {
          name: item.querySelector('.product-name')?.textContent?.trim() || '',
          price: item.querySelector('.product-price')?.textContent?.trim() || '',
          url: item.querySelector('a')?.href || '',
          availability: item.querySelector('.availability')?.textContent?.trim() || ''
        };
      });
    });

    return products;

  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Optional: Save to Supabase
export async function saveToSupabase(products: Product[]) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('products')
    .upsert(products.map(product => ({
      name: product.name,
      price: product.price,
      url: product.url,
      availability: product.availability,
      last_checked: new Date().toISOString()
    })));

  if (error) throw error;
  return data;
} 