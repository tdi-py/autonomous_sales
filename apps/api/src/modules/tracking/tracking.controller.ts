import {
  Controller,
  Get,
  Post,
  Param,
  Redirect,
  Res,
  Logger,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TrackingService as TrackingApiService } from './tracking.service';

// 1x1 transparent GIF pixel
const TRANSPARENT_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

@ApiTags('Tracking')
@Controller()
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(private readonly trackingService: TrackingApiService) {}

  // ─── Open Tracking ────────────────────────────────────────────────────────

  @Get('track/open/:outreachEventId')
  @ApiOperation({ summary: 'Email open tracking pixel (public)' })
  async trackOpen(
    @Param('outreachEventId') outreachEventId: string,
    @Res() res: Response,
  ) {
    // Fire and forget — don't await, return pixel immediately
    this.trackingService.recordOpen(outreachEventId).catch((err) =>
      this.logger.error(`[tracking] Open record failed: ${err.message}`),
    );

    // Return 1x1 transparent pixel
    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': TRANSPARENT_PIXEL.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    return res.end(TRANSPARENT_PIXEL);
  }

  // ─── Click Tracking ───────────────────────────────────────────────────────

  @Get('track/click/:outreachEventId/:linkHash')
  @ApiOperation({ summary: 'Email click tracking redirect (public)' })
  async trackClick(
    @Param('outreachEventId') outreachEventId: string,
    @Param('linkHash') linkHash: string,
    @Res() res: Response,
  ) {
    const originalUrl = this.trackingService.decodeLinkHash(linkHash);

    // Record click async
    this.trackingService.recordClick(outreachEventId, originalUrl, linkHash).catch((err) =>
      this.logger.error(`[tracking] Click record failed: ${err.message}`),
    );

    // Redirect to original URL
    if (originalUrl && (originalUrl.startsWith('http://') || originalUrl.startsWith('https://'))) {
      return res.redirect(302, originalUrl);
    }

    return res.redirect(302, 'https://google.com');
  }

  // ─── Unsubscribe (GET — shows page) ──────────────────────────────────────

  @Get('unsubscribe/:outreachEventId')
  @ApiOperation({ summary: 'Unsubscribe page (public)' })
  async unsubscribePage(
    @Param('outreachEventId') outreachEventId: string,
    @Res() res: Response,
  ) {
    // Process unsubscribe immediately
    const result = await this.trackingService.processUnsubscribe(outreachEventId);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Unsubscribed</title>
  <style>
    body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
    .card { background: white; padding: 48px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; max-width: 480px; }
    h1 { color: #111; font-size: 24px; margin: 0 0 16px; }
    p { color: #6b7280; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✅ Başarıyla Abonelikten Çıktınız</h1>
    <p>Email listemizden başarıyla çıkarıldınız. Artık bu kampanyadan email almayacaksınız.</p>
  </div>
</body>
</html>`;

    res.set('Content-Type', 'text/html');
    return res.send(html);
  }

  // ─── One-Click Unsubscribe (POST — RFC 8058) ──────────────────────────────

  @Post('unsubscribe/one-click')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'One-click unsubscribe RFC 8058 (public)' })
  async oneClickUnsubscribe(@Body() body: Record<string, string>) {
    // RFC 8058: body contains List-Unsubscribe=One-Click
    // The outreachEventId should be passed as query param by email clients
    // This is a best-effort endpoint
    this.logger.log('[tracking] One-click unsubscribe received');
    return { success: true };
  }
}