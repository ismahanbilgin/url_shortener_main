import { IncomingMessage, ServerResponse } from 'http';
import { verifyToken } from '../utils/jwt.js';
import { CustomRequest } from '../types.js';

export async function authMiddleware(req: CustomRequest, res: ServerResponse): Promise<boolean> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Token gerekli' }));
    return false;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return true;
  } catch (err) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Geçersiz token' }));
    return false;
  }
}
