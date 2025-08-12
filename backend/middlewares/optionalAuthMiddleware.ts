import { CustomRequest } from '../types.js'
import { verifyToken } from '../utils/jwt.js';

/**
 * Token varsa çözümler ve req.user içine ekler.
 * Token yoksa veya geçersizse req.user = null olur.
 */
import { ServerResponse } from 'http';

export async function optionalAuthMiddleware(req: CustomRequest, res: ServerResponse): Promise<void> {

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyToken(token);
      console.log('çözümlenen token:', decoded);
      req.user = decoded;
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
}
