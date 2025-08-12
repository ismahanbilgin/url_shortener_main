import { IncomingMessage, ServerResponse } from 'http';
import { handleGetUrls } from '../controllers/handleGetUrls.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';


//  Kullanıcının kendi URL'lerini listeleyen GET /urls endpoint'i
//  Route eşleşirse true, eşleşmezse false döner

export async function urlRoutes(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  if (req.url === '/urls' && req.method === 'GET') {
    const ok = await authMiddleware(req, res);
    if (!ok) return true; // yetkisizse yine handled sayılır
    await handleGetUrls(req, res);
    return true;
  }

  return false; // bu router ilgilenmiyor
}
