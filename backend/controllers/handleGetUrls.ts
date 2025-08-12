import { ServerResponse } from 'http';
import pool from '../db.js';

import { CustomRequest } from '../types.js'
export async function handleGetUrls(req: CustomRequest, res: ServerResponse) {

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Yetkisiz erişim' }));
      return;
    }

    const result = await pool.query(
      'SELECT id, long_url, short_code, created_at, expiration FROM urls WHERE user_id = $1',
      [userId]
    );

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ urls: result.rows }));

  } catch (err) {

    console.error('GET /urls error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Sunucu hatası' }));

  }
}
