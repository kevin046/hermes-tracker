import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { supabase } from '@/lib/supabase'

puppeteer.use(StealthPlugin())

interface ScrapedProduct {
  name: string;
  sku: string;
  price?: string;
  available: boolean;
  url: string;
  color?: string;
  material?: string;
  size?: string;
}

export class ScrapingService {
  private browser: any;
  private page: any;

  private readonly HERMES_URLS = [
    'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/bags-and-clutches/birkin/',
    'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/bags-and-clutches/kelly/',
    'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/bags-and-clutches/constance/',
    // Add more URLs as needed
  ];

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-dev-shm-usage'
      ]
    });
    this.page = await this.browser.newPage();

    // Configure stealth
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br'
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async randomDelay(min = 2000, max = 5000) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];

    try {
      for (const url of this.HERMES_URLS) {
        console.log(`Scraping: ${url}`);
        await this.randomDelay();

        try {
          await this.page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 60000
          });

          // Handle cookie consent if present
          try {
            const cookieButton = await this.page.$('button#onetrust-accept-btn-handler');
            if (cookieButton) {
              await cookieButton.click();
              await this.randomDelay(1000, 2000);
            }
          } catch (error) {
            console.log('No cookie consent needed');
          }

          // Get all product links
          const productLinks = await this.page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="/product/"]'));
            return links.map((link: any) => link.href);
          });

          // Visit each product page
          for (const productUrl of productLinks) {
            await this.randomDelay();
            const product = await this.scrapeProductPage(productUrl);
            if (product) {
              products.push(product);
              await this.saveProduct(product);
            }
          }
        } catch (error) {
          console.error(`Error scraping ${url}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during scraping:', error);
    }

    return products;
  }

  private async scrapeProductPage(url: string): Promise<ScrapedProduct | null> {
    try {
      const newPage = await this.browser.newPage();
      await newPage.setUserAgent(this.page.userAgent());
      
      await newPage.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      const product = await newPage.evaluate(() => {
        const name = document.querySelector('h1')?.textContent?.trim();
        const sku = document.querySelector('[data-product-reference]')?.getAttribute('data-product-reference');
        const price = document.querySelector('.product-price')?.textContent?.trim();
        const details = document.querySelector('.product-description')?.textContent?.trim();
        
        // Check availability (this might need adjustment based on Hermès website structure)
        const outOfStock = document.querySelector('.out-of-stock, .unavailable');
        const available = !outOfStock;

        return {
          name,
          sku,
          price,
          available,
          details
        };
      });

      await newPage.close();

      if (!product.name || !product.sku) {
        return null;
      }

      return {
        name: product.name,
        sku: product.sku,
        price: product.price,
        available: product.available,
        url,
        color: this.extractColor(product.details),
        material: this.extractMaterial(product.details),
        size: this.extractSize(product.details)
      };
    } catch (error) {
      console.error(`Error scraping product page ${url}:`, error);
      return null;
    }
  }

  private async saveProduct(product: ScrapedProduct) {
    try {
      const { error } = await supabase
        .from('products')
        .upsert({
          sku: product.sku,
          name: product.name,
          price: product.price,
          available: product.available,
          url: product.url,
          color: product.color,
          material: product.material,
          size: product.size,
          last_checked: new Date().toISOString()
        }, {
          onConflict: 'sku'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving product:', error);
    }
  }

  private extractColor(details?: string): string | undefined {
    if (!details) return undefined;
    const colors = [
      'Noir', 'Gold', 'Etoupe', 'Rouge H', 'Bleu',
      'Etain', 'Craie', 'Rose', 'Vert', 'Jaune'
    ];
    return colors.find(color => details.includes(color));
  }

  private extractMaterial(details?: string): string | undefined {
    if (!details) return undefined;
    const materials = [
      'Togo', 'Epsom', 'Clemence', 'Swift', 'Box',
      'Barenia', 'Chevre', 'Ostrich', 'Crocodile'
    ];
    return materials.find(material => details.includes(material));
  }

  private extractSize(details?: string): string | undefined {
    if (!details) return undefined;
    const sizes = ['25', '30', '35', '40', '28', '32'];
    return sizes.find(size => details.includes(size));
  }
} 