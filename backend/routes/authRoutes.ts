import http from 'http';
import { loginController } from '../controllers/auth/loginController.js';
import { registerController } from '../controllers/auth/registerController.js';
import { rateLimitMiddleware } from '../middlewares/rateLimitMiddleware.js';
/**
 * Auth işlemlerini yöneten router fonksiyonu
 * İstek bu dosyada karşılanırsa true döner, karşılanmazsa false döner.
 */
export async function authRoutes(req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean> {
  const { method, url } = req;

  if (url === '/register' && method === 'POST') {
     if (!rateLimitMiddleware(req, res, { limit: 5, windowMs: 60000 })) return true;
    await registerController(req, res);
    return true;
  }

  if (url === '/login' && method === 'POST') {

     if (!rateLimitMiddleware(req, res, { limit: 5, windowMs: 60000 })) return true;
 
    await loginController(req, res);
    return true;
  }

  return false; // bu router ilgilenmiyor
}
