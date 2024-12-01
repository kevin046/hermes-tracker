import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { createClient } from '@supabase/supabase-js'
import ProxyChain from 'proxy-chain'

puppeteer.use(StealthPlugin())

// Add proxy list - you can add more proxies to this list
const PROXY_LIST = [
  'http://proxy1.example.com:8080',
  'http://proxy2.example.com:8080',
  // Add more proxies here
  // You can use services like Bright Data, Oxylabs, or other proxy providers
];

interface ScrapedProduct {
  name: string;
  sku: string;
  price?: string;
  available: boolean;
  url: string;
  color?: string;
  material?: string;
  size?: string;
  region: string;
  imageUrl?: string;
}

export class ScrapingService {
  private browser: any;
  private page: any;
  private currentProxyIndex: number = 0;

  private readonly TARGET_URL = 'https://www.hermes.com/ca/en/category/women/bags-and-small-leather-goods/bags-and-clutches/';
  private readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36',
    // Add more user agents for rotation
  ];

  private getRandomUserAgent(): string {
    return this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
  }

  private async getNextProxy(): Promise<string> {
    const proxy = PROXY_LIST[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % PROXY_LIST.length;
    return await ProxyChain.anonymizeProxy(proxy);
  }

  async initialize() {
    try {
      const proxy = await this.getNextProxy();
      
      this.browser = await puppeteer.launch({
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins',
          `--proxy-server=${proxy}`,
          '--window-size=1920,1080'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Randomize user agent
      await this.page.setUserAgent(this.getRandomUserAgent());
      
      // Set viewport
      await this.page.setViewport({ width: 1920, height: 1080 });

      // Set extra headers
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-CA,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1'
      });

      // Enable request interception
      await this.page.setRequestInterception(true);
      this.page.on('request', (request: any) => {
        if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
          request.abort();
        } else {
          request.continue();
        }
      });
    } catch (error) {
      console.error('Error initializing browser:', error);
      throw error;
    }
  }

  private async switchProxy() {
    try {
      await this.browser.close();
      await this.initialize();
    } catch (error) {
      console.error('Error switching proxy:', error);
      throw error;
    }
  }

  private async retryWithNewProxy<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i < maxRetries - 1) {
          console.log('Switching proxy and retrying...');
          await this.switchProxy();
          await this.randomDelay(5000, 10000); // Longer delay between retries
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries reached');
  }

  private async randomDelay(min = 2000, max = 5000) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    return this.retryWithNewProxy(async () => {
      const products: ScrapedProduct[] = [];
      console.log('Starting scraping process...');

      try {
        console.log('Navigating to Hermes website...');
        await this.page.goto(this.TARGET_URL, {
          waitUntil: 'networkidle0',
          timeout: 60000
        });

        await this.handleCookieConsent();

        console.log('Waiting for products to load...');
        await this.page.waitForSelector('.product-item, .product-grid-item', { timeout: 30000 });

        console.log('Scrolling to load all products...');
        await this.autoScroll();

        const productUrls = await this.page.evaluate(() => {
          const urls = new Set<string>();
          document.querySelectorAll('a[href*="/product/"]').forEach((link: any) => {
            if (link.href && !link.href.includes('#')) {
              urls.add(link.href);
            }
          });
          return Array.from(urls);
        });

        console.log(`Found ${productUrls.length} product URLs`);

        for (const [index, url] of productUrls.entries()) {
          try {
            console.log(`Processing product ${index + 1}/${productUrls.length}`);
            const newPage = await this.browser.newPage();
            await newPage.setViewport({ width: 1920, height: 1080 });
            await newPage.setUserAgent(this.page.userAgent());

            await newPage.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

            const productData = await newPage.evaluate(() => {
              const getTextContent = (selector: string) => {
                const element = document.querySelector(selector);
                return element ? element.textContent?.trim() : null;
              };

              const name = getTextContent('.product-title') || getTextContent('h1');
              const price = getTextContent('.product-price');
              const sku = document.querySelector('[data-product-reference]')?.getAttribute('data-product-reference');
              const available = !document.querySelector('.unavailable, .out-of-stock');
              const imageUrl = document.querySelector('.product-image img')?.getAttribute('src');

              const specs = Array.from(document.querySelectorAll('.product-specification li')).reduce((acc: any, el) => {
                const text = el.textContent?.trim() || '';
                if (text.toLowerCase().includes('color')) acc.color = text.split(':')[1]?.trim();
                if (text.toLowerCase().includes('material')) acc.material = text.split(':')[1]?.trim();
                if (text.toLowerCase().includes('size')) acc.size = text.split(':')[1]?.trim();
                return acc;
              }, {});

              return {
                name,
                price,
                sku,
                available,
                imageUrl,
                ...specs
              };
            });

            if (productData.name) {
              const product: ScrapedProduct = {
                name: productData.name,
                sku: productData.sku || `HERMES-${Date.now()}`,
                price: productData.price,
                available: productData.available,
                url,
                color: productData.color,
                material: productData.material,
                size: productData.size,
                region: 'CA',
                imageUrl: productData.imageUrl
              };

              products.push(product);
              await this.saveProduct(product);
              console.log(`Saved product: ${product.name}`);
            }

            await newPage.close();
            await new Promise(r => setTimeout(r, 2000));
          } catch (error) {
            console.error(`Error processing product URL ${url}:`, error);
          }
        }

        // Add random delays between actions
        await this.randomDelay(3000, 7000);
        
        // Rotate user agent periodically
        await this.page.setUserAgent(this.getRandomUserAgent());

      } catch (error) {
        console.error('Error during scraping:', error);
        throw error;
      } finally {
        console.log(`Scraping completed. Found ${products.length} products.`);
        await this.browser.close();
      }

      return products;
    });
  }

  private async autoScroll() {
    await this.page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });
    await this.page.waitForTimeout(3000);
  }

  private async handleCookieConsent() {
    try {
      const selectors = [
        '#onetrust-accept-btn-handler',
        'button[aria-label="Accept cookies"]',
        '.cookie-accept-button'
      ];

      for (const selector of selectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          await this.page.click(selector);
          await this.page.waitForTimeout(1000);
          break;
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      console.log('No cookie consent banner found or already accepted');
    }
  }

  private async saveProduct(product: ScrapedProduct) {
    try {
      // Get service role client for admin operations
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const { error } = await supabaseAdmin
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
          region: product.region,
          image_url: product.imageUrl,
          last_checked: new Date().toISOString()
        }, {
          onConflict: 'sku,region'
        });

      if (error) {
        console.error('Error saving product to Supabase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in saveProduct:', error);
    }
  }
} 