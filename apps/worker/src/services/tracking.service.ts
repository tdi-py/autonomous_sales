import { Injectable, Logger } from '@nestjs/common';

export interface TrackingUrls {
  openPixelUrl: string;
  unsubscribeUrl: string;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly apiDomain: string;

  constructor() {
    this.apiDomain = process.env.API_DOMAIN ?? 'http://localhost:3001/api';
  }

  // ─── Open Pixel URL ───────────────────────────────────────────────────────

  getOpenPixelUrl(outreachEventId: string): string {
    return `${this.apiDomain}/track/open/${outreachEventId}`;
  }

  // ─── Click Tracking URL ───────────────────────────────────────────────────

  getClickTrackingUrl(outreachEventId: string, originalUrl: string): string {
    const linkHash = Buffer.from(originalUrl).toString('base64url');
    return `${this.apiDomain}/track/click/${outreachEventId}/${linkHash}`;
  }

  // ─── Unsubscribe URL ──────────────────────────────────────────────────────

  getUnsubscribeUrl(outreachEventId: string): string {
    return `${this.apiDomain}/unsubscribe/${outreachEventId}`;
  }

  // ─── Inject Tracking Pixel ────────────────────────────────────────────────

  injectOpenPixel(html: string, outreachEventId: string): string {
    const pixelUrl = this.getOpenPixelUrl(outreachEventId);
    const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;border:0;" alt="" />`;

    // Inject before </body> if exists, otherwise append
    if (html.includes('</body>')) {
      return html.replace('</body>', `${pixel}</body>`);
    }
    return html + pixel;
  }

  // ─── Wrap All Links ───────────────────────────────────────────────────────

  wrapLinks(html: string, outreachEventId: string): string {
    // Match all <a href="..."> tags
    // Skip mailto:, tel:, and already-tracking links, and unsubscribe links
    return html.replace(
      /<a\s([^>]*?)href="([^"]+)"([^>]*?)>/gi,
      (match, before, url, after) => {
        // Skip special URLs
        if (
          url.startsWith('mailto:') ||
          url.startsWith('tel:') ||
          url.startsWith('#') ||
          url.includes('/track/click/') ||
          url.includes('/unsubscribe/')
        ) {
          return match;
        }

        const trackingUrl = this.getClickTrackingUrl(outreachEventId, url);
        return `<a ${before}href="${trackingUrl}"${after}>`;
      },
    );
  }

  // ─── Inject Unsubscribe Link ──────────────────────────────────────────────

  replaceUnsubscribeLink(html: string, outreachEventId: string): string {
    const unsubUrl = this.getUnsubscribeUrl(outreachEventId);
    return html.replace(/\{\{unsubscribe_link\}\}/g, unsubUrl);
  }

  // ─── Build List-Unsubscribe Headers (RFC 2369 + RFC 8058) ─────────────────

  getListUnsubscribeHeaders(outreachEventId: string): {
    'List-Unsubscribe': string;
    'List-Unsubscribe-Post': string;
  } {
    const unsubUrl = this.getUnsubscribeUrl(outreachEventId);
    return {
      'List-Unsubscribe': `<${unsubUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
  }

  // ─── Full HTML Injection Pipeline ─────────────────────────────────────────

  injectAllTracking(
    html: string,
    outreachEventId: string,
    physicalAddress: string,
  ): string {
    let processed = html;

    // 1. Replace unsubscribe placeholder with real URL
    processed = this.replaceUnsubscribeLink(processed, outreachEventId);

    // 2. Replace physical address placeholder
    processed = processed.replace(
      /\{\{physical_address\}\}/g,
      physicalAddress,
    );

    // 3. Wrap all links with click tracking
    processed = this.wrapLinks(processed, outreachEventId);

    // 4. Inject open tracking pixel
    processed = this.injectOpenPixel(processed, outreachEventId);

    return processed;
  }

  // ─── HTML to Plain Text ───────────────────────────────────────────────────

  htmlToPlainText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // ─── Decode Link Hash ─────────────────────────────────────────────────────

  decodeLinkHash(linkHash: string): string {
    try {
      return Buffer.from(linkHash, 'base64url').toString('utf-8');
    } catch {
      return '';
    }
  }
}