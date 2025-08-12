import { IncomingMessage, ServerResponse } from 'http';

/**
 * Basit CORS middleware’i
 */
export function corsMiddleware(req: IncomingMessage, res: ServerResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Geliştirme için '*', üretimde spesifik domain
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return true; // Ön uç OPTIONS isteği atarsa burada sonlandırılır
  }

  return false; // Devam etsin
}
