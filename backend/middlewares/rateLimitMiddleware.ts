// middlewares/rateLimitMiddleware.ts

import { IncomingMessage, ServerResponse } from 'http';
import { CustomRequest } from '../types.js';

type RateLimitRecord = {
  count: number;
  firstRequestTimestamp: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

// İstekten userId veya IP alır
function getIdentifier(req: CustomRequest): string {
  const userId = req.user?.userId;
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${req.socket.remoteAddress || 'unknown'}`;
}

/**
 * Oran sınırlama middleware fonksiyonu.
 * @param req HTTP isteği (CustomRequest olmalı ki user alanı olsun)
 * @param res HTTP yanıtı
 * @param options Limit ve zaman aralığı ayarları
 * @returns true: istek kabul edildi, false: limit aşıldı ve istek reddedildi
 */
export function rateLimitMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  options: RateLimitOptions = { limit: 10, windowMs: 60000 }
): boolean {
  // Burada req'nin CustomRequest olmasını garanti et
  const customReq = req as CustomRequest;

  const identifier = getIdentifier(customReq);
  const now = Date.now();
  const { limit, windowMs } = options;

  const record = rateLimitMap.get(identifier);

  if (!record) {
    rateLimitMap.set(identifier, { count: 1, firstRequestTimestamp: now });
    return true;
  }

  if (now - record.firstRequestTimestamp > windowMs) {
    rateLimitMap.set(identifier, { count: 1, firstRequestTimestamp: now });
    return true;
  }

  if (record.count >= limit) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Çok fazla istek yapıldı. Lütfen biraz bekleyin.',
      retryAfter: windowMs / 1000
    }));
    return false;
  }

  record.count++;
  return true;
}
