import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { inspect } from 'util';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  // ANSI color codes
  private readonly colors = {
    gray: '\x1b[90m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
  };

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, headers, body } = req;

    // Extract bearer token if present
    const authHeader = headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    // Format timestamp
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    // Log request line with inline token
    const { gray, cyan, reset } = this.colors;
    console.log(
      `${gray}%s${reset} ${cyan}%s${reset} %s`,
      timestamp,
      `${method} ${originalUrl}`,
      token ? `[Bearer ${token}]` : '[No token]',
    );

    // Request Body (if not empty)
    if (body && Object.keys(body).length > 0) {
      const maskedBody = { ...body };
      console.log(
        inspect(maskedBody, { colors: true, depth: null, compact: true }),
      );
      console.log(); // Empty line after body
    }

    next();
  }
}
