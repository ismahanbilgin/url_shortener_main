import { CustomRequest } from '../types.js';
import { ServerResponse } from 'http';
import { profileController } from '../controllers/profileController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

export async function profileRoutes(req: CustomRequest, res: ServerResponse) {
  if (req.url === '/profile' && req.method === 'GET') {
    const authorized = await authMiddleware(req, res);
    if (!authorized) return;

    await profileController(req, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route bulunamadı' }));
}
