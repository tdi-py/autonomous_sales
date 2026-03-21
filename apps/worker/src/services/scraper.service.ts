import { Injectable, Logger } from '@nestjs/common';
import { chromium, type Browser, type Page } from 'playwright';

export interface ScrapedData {
  title: string;
  metaDescription: string;
  headings: { h1: string[]; h2: string[]; h3: string[] };
  bodyText: string;
  navLinks: string[];
  footerInfo: string;
  testimonials: string;
  pricing: string;
  openGraph: { title: string; description: string; image: string };
  rawHtml?: string;
}

const REAL_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '10.',
  '192.168.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
];

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  validateUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only http/https URLs are allowed');
    }

    const hostname = parsed.hostname.toLowerCase();
    for (const blocked of BLOCKED_HOSTS) {
      if (hostname === blocked || hostname.startsWith(blocked)) {
        throw new Error(`Blocked hostname: ${hostname}`);
      }
    }
  }

  async scrape(url: string): Promise<ScrapedData> {
    this.validateUrl(url);

    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: REAL_USER_AGENT,
        extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
      });

      const mainData = await this.scrapePage(context, url);

      // Try supplementary pages if main page is sparse
      const bodyWordCount = mainData.bodyText.split(/\s+/).length;
      if (bodyWordCount < 100) {
        const baseUrl = new URL(url).origin;
        for (const path of ['/about', '/features', '/pricing']) {
          try {
            const extra = await this.scrapePage(context, `${baseUrl}${path}`);
            if (extra.bodyText.length > 100) {
              mainData.bodyText = `${mainData.bodyText}\n\n[From ${path}]: ${extra.bodyText}`.slice(0, 5000);
              break;
            }
          } catch {
            // ignore missing subpages
          }
        }
      }

      await context.close();
      return mainData;
    } finally {
      if (browser) await browser.close();
    }
  }

  private async scrapePage(
    context: Awaited<ReturnType<Browser['newContext']>>,
    url: string,
  ): Promise<ScrapedData> {
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

      const data = await page.evaluate((): ScrapedData => {
        const getText = (el: Element | null) => el?.textContent?.trim() ?? '';
        const getAttr = (sel: string, attr: string) =>
          (document.querySelector(sel) as HTMLMetaElement | null)?.getAttribute(attr) ?? '';

        // Headings
        const h1 = Array.from(document.querySelectorAll('h1')).map((e) => e.textContent?.trim() ?? '');
        const h2 = Array.from(document.querySelectorAll('h2'))
          .slice(0, 10)
          .map((e) => e.textContent?.trim() ?? '');
        const h3 = Array.from(document.querySelectorAll('h3'))
          .slice(0, 10)
          .map((e) => e.textContent?.trim() ?? '');

        // Nav links text
        const navLinks = Array.from(document.querySelectorAll('nav a'))
          .map((a) => a.textContent?.trim() ?? '')
          .filter(Boolean)
          .slice(0, 20);

        // Footer
        const footer = document.querySelector('footer');
        const footerInfo = footer ? (footer.textContent?.trim().slice(0, 500) ?? '') : '';

        // Testimonials
        const testimonialSections = document.querySelectorAll(
          '[class*="testimonial"], [class*="review"], [class*="quote"], [id*="testimonial"]',
        );
        const testimonials = Array.from(testimonialSections)
          .map((el) => el.textContent?.trim() ?? '')
          .join(' ')
          .slice(0, 1000);

        // Pricing
        const pricingSections = document.querySelectorAll(
          '[class*="pricing"], [class*="plan"], [id*="pricing"]',
        );
        const pricing = Array.from(pricingSections)
          .map((el) => el.textContent?.trim() ?? '')
          .join(' ')
          .slice(0, 500);

        // Body text – remove scripts/styles first
        const body = document.body.cloneNode(true) as HTMLElement;
        body.querySelectorAll('script, style, nav, footer, header').forEach((el) => el.remove());
        const bodyText = (body.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 5000);

        return {
          title: document.title,
          metaDescription: getAttr('meta[name="description"]', 'content'),
          headings: { h1, h2, h3 },
          bodyText,
          navLinks,
          footerInfo,
          testimonials,
          pricing,
          openGraph: {
            title: getAttr('meta[property="og:title"]', 'content'),
            description: getAttr('meta[property="og:description"]', 'content'),
            image: getAttr('meta[property="og:image"]', 'content'),
          },
        };
      });

      return data;
    } finally {
      await page.close();
    }
  }
}