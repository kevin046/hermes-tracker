import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { supabase } from '@/lib/supabase'

puppeteer.use(StealthPlugin())

interface HermesProduct {
  sku: string;
  name: string;
  category: string;
  price?: number;
  currency?: string;
  color?: string;
  material?: string;
  size?: string;
  url?: string;
  available?: boolean;
}

export class HermesScraper {
  private browser: any;
  private page: any;

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    this.page = await this.browser.newPage();
    
    // Set stealth mode
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Add request interception
    await this.page.setRequestInterception(true);
    this.page.on('request', (request: any) => {
      if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font') {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async getProductDetails(url: string): Promise<Partial<HermesProduct>> {
    const newPage = await this.browser.newPage();
    try {
      await newPage.setUserAgent(this.page.userAgent());
      await newPage.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // Check for availability
      const available = await newPage.evaluate(() => {
        const availabilityElement = document.querySelector('.availability-status');
        const addToCartButton = document.querySelector('button[data-action-type="add-to-cart"]');
        return !!(availabilityElement || addToCartButton);
      });

      // Get detailed information
      const details = await newPage.evaluate(() => {
        const priceElement = document.querySelector('.product-price');
        const descriptionElement = document.querySelector('.product-description');
        const specificationElements = document.querySelectorAll('.product-specification li');

        const specifications: Record<string, string> = {};
        specificationElements.forEach(spec => {
          const text = (spec as HTMLElement).textContent || '';
          const [key, value] = text.split(':').map(s => s.trim());
          if (key && value) {
            specifications[key.toLowerCase()] = value;
          }
        });

        return {
          price: priceElement?.textContent?.trim(),
          description: descriptionElement?.textContent?.trim(),
          ...specifications
        };
      });

      return {
        available,
        ...details
      };
    } catch (error) {
      console.error(`Error getting product details from ${url}:`, error);
      return {};
    } finally {
      await newPage.close();
    }
  }

  async getProducts(): Promise<HermesProduct[]> {
    const products: HermesProduct[] = [];
    const productUrls = new Set<string>();
    
    try {
      const categoryUrls = [
        // Iconic Collections
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/birkin/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/kelly/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/constance/',
        
        // Classic Collections
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/lindy/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/picotin/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/garden-party/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/evelyne/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/bolide/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/herbag/',
        
        // Bag Categories
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/bags-and-clutches/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/clutches-evening-bags/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/shoulder-bags/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/cross-body-bags/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/mini-bags/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/tote-bags/',
        
        // New Collections
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/new/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/trending/',
        
        // Special Categories
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/limited-edition/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/exotic/',
        
        // Additional Collections
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/verrou/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/halzan/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/roulis/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/24-24/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/toolbox/',
        
        // Men's Collections
        'https://www.hermes.com/us/en/category/men/bags-and-small-leather-goods/bags/',
        'https://www.hermes.com/us/en/category/men/bags-and-small-leather-goods/briefcases/',
        
        // Seasonal Collections (update these URLs based on current season)
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/spring-summer/',
        'https://www.hermes.com/us/en/category/women/bags-and-small-leather-goods/fall-winter/'
      ];

      // Add regional URLs
      const regions = ['fr', 'uk', 'jp', 'hk', 'sg'];
      const baseUrls = categoryUrls.filter(url => url.includes('/us/en/'));
      
      regions.forEach(region => {
        baseUrls.forEach(url => {
          const regionalUrl = url.replace('/us/en/', `/${region}/en/`);
          categoryUrls.push(regionalUrl);
        });
      });

      // Process each category
      for (const categoryUrl of categoryUrls) {
        try {
          console.log(`Scanning category: ${categoryUrl}`);
          await this.page.goto(categoryUrl, {
            waitUntil: 'networkidle0',
            timeout: 60000
          });

          // Enhanced cookie consent handling
          await this.handleCookieConsent();

          // Enhanced scroll with dynamic content loading
          await this.autoScrollWithDynamicLoading();

          // Get all product links with enhanced selectors
          const links = await this.page.evaluate(() => {
            const selectors = [
              'a.product-item-link',
              'a.product-grid-item-link',
              'a[href*="/product/"]',
              'a[data-product-id]',
              '.product-item a',
              '.item-details a',
              'a[href*="bags-and-small-leather-goods"]'
            ];
            
            const links = new Set<string>();
            
            selectors.forEach(selector => {
              document.querySelectorAll(selector).forEach(element => {
                const href = (element as HTMLAnchorElement).href;
                if (
                  href &&
                  href.includes('/product/') &&
                  !href.includes('#') &&
                  !href.includes('javascript:')
                ) {
                  links.add(href);
                }
              });
            });

            return Array.from(links);
          });

          links.forEach(link => productUrls.add(link));
          console.log(`Found ${links.length} products in ${categoryUrl}`);

          // Randomized delay between categories
          await this.randomDelay(3000, 5000);
        } catch (error) {
          console.error(`Error processing category ${categoryUrl}:`, error);
          // Continue with next category after error
          continue;
        }
      }

      console.log(`Found ${productUrls.size} unique products total`);

      // Process products with enhanced error handling
      for (const url of productUrls) {
        try {
          await this.processProduct(url, products);
        } catch (error) {
          console.error(`Error processing product at ${url}:`, error);
          // Retry once after error
          try {
            await this.randomDelay(5000, 8000);
            await this.processProduct(url, products);
          } catch (retryError) {
            console.error(`Retry failed for ${url}:`, retryError);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }

    return products;
  }

  private extractMaterial(details?: string): string | undefined {
    if (!details) return undefined;
    const materials = [
      'Togo', 'Epsom', 'Clemence', 'Swift', 'Box', 'Barenia',
      'Chevre', 'Ostrich', 'Crocodile', 'Alligator', 'Lizard'
    ];
    return materials.find(material => details.includes(material));
  }

  private extractColor(details?: string): string | undefined {
    if (!details) return undefined;
    const colors = [
      'Noir', 'Gold', 'Etoupe', 'Rouge H', 'Bleu', 'Etain',
      'Craie', 'Rose', 'Vert', 'Jaune', 'Orange', 'Bordeaux'
    ];
    return colors.find(color => details.includes(color));
  }

  private extractSize(details?: string): string | undefined {
    if (!details) return undefined;
    const sizes = ['25', '30', '35', '40', '28', '32'];
    return sizes.find(size => details.includes(size));
  }

  // Helper method to scroll page
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
        }, 100);
      });
    });
  }

  private async handleCookieConsent() {
    try {
      const selectors = [
        'button#onetrust-accept-btn-handler',
        '#cookie-accept',
        '.cookie-consent-accept',
        'button[aria-label="Accept cookies"]'
      ];

      for (const selector of selectors) {
        const button = await this.page.$(selector);
        if (button) {
          await button.click();
          await this.page.waitForTimeout(1000);
          break;
        }
      }
    } catch (error) {
      console.log('No cookie consent needed or error handling consent');
    }
  }

  private async autoScrollWithDynamicLoading() {
    await this.page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        let distance = 100;
        let timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          // Check for dynamic content loading
          const loadingIndicator = document.querySelector('.loading-indicator, .load-more, .show-more');
          if (loadingIndicator) {
            // Wait for content to load
            distance = 50; // Slower scroll when loading
          } else {
            distance = 100; // Normal scroll
          }

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Wait for any dynamic content to finish loading
    await this.page.waitForTimeout(2000);
  }

  private async randomDelay(min: number, max: number) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async processProduct(url: string, products: HermesProduct[]) {
    await this.page.goto(url, { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });

    const productInfo = await this.extractProductInfo();
    if (productInfo.sku) {
      const details = await this.getProductDetails(url);
      products.push({
        ...productInfo,
        available: details.available,
        url
      });

      console.log(`Processed product: ${productInfo.name}`);
    }

    await this.randomDelay(2000, 4000);
  }

  private async extractProductInfo() {
    return await this.page.evaluate(() => {
      const selectors = {
        name: ['.product-title', '.product-name', 'h1', '[data-product-name]'],
        sku: ['.product-reference', '.product-sku', '[data-product-id]', '[data-sku]'],
        price: ['.product-price', '.price', '.product-price-value', '[data-price]'],
        details: ['.product-details', '.product-description', '.product-info', '[data-product-details]']
      };

      const getContent = (selectorList: string[]) => {
        for (const selector of selectorList) {
          const element = document.querySelector(selector);
          if (element?.textContent) {
            return element.textContent.trim();
          }
        }
        return undefined;
      };

      const priceText = getContent(selectors.price);
      return {
        name: getContent(selectors.name),
        sku: getContent(selectors.sku),
        price: priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : undefined,
        currency: priceText?.includes('$') ? 'USD' : undefined,
        details: getContent(selectors.details)
      };
    });
  }
} 