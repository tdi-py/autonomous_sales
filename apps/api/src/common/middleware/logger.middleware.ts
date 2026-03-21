import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const durationMs = Date.now() - startTime;

      const logFn =
        statusCode >= 500
          ? this.logger.error.bind(this.logger)
          : statusCode >= 400
            ? this.logger.warn.bind(this.logger)
            : this.logger.log.bind(this.logger);

      logFn(`${method} ${originalUrl} → ${statusCode} (${durationMs}ms)`);
    });

    next();
  }
}