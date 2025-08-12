import { ServerResponse } from 'http';
import pool from '../db.js';
import { CustomRequest } from '../types.js';

// Kullanıcı profilini ve ona ait URL'leri dönen controller
export async function profileController(req: CustomRequest, res: ServerResponse) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Yetkilendirme hatası' }));
      return;
    }

    // ✅ Kullanıcının bilgilerini getiriyoruz
    const result = await pool.query(
      'SELECT id, email, username FROM users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];

    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Kullanıcı bulunamadı' }));
      return;
    }

    // Bu kullanıcıya ait URL'leri ve tıklanma sayılarını alıyoruz
    const urlsResult = await pool.query(
      'SELECT id,long_url, short_code, click_count FROM urls WHERE user_id = $1',
      [userId]
    );
    const urls = urlsResult.rows.map(row => ({
      id: row.id,
      long_url: row.long_url,
      short_code: row.short_code,
      click_count: row.click_count,
      shortUrl: `http://localhost:5000/${row.short_code}` // 
    }));
    // kullanıcının URL listesi

    // Artık sadece user değil, user + urls birlikte dönüyor
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ user, urls }));
  } catch (err) {
    console.error('Profil hatası:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Sunucu hatası' }));
  }
}
