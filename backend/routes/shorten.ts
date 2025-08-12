import {ServerResponse} from 'http';
import http from 'http';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { generateShortCode } from '../utils/generateShortCode.js';
import { parseRequestBody } from '../utils/parseRequestBody.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { optionalAuthMiddleware } from '../middlewares/optionalAuthMiddleware.js';
import { CustomRequest } from '../types.js';

export async function handleShorten(req: CustomRequest, res: ServerResponse) {
  try {
    const data = await parseRequestBody(req);
    const longUrl = data.url;
    const ttl = Number(data.ttl);
    const customCode = data.customCode;
    const urlPassword = data.password;

    if (urlPassword) {
      const authorized = await authMiddleware(req, res);
      if (!authorized) return;
    } else {
      await optionalAuthMiddleware(req, res);
    }

    if (!longUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'URL gerekli' }));
      return;
    }

    try {
      new URL(longUrl);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Geçersiz URL' }));
      return;
    }

    const userId = req.user?.userId || null;
    console.log('👉 Kullanıcı ID:', userId);

    const rawCode = customCode || await generateShortCode();
    const shortCode = rawCode.substring(0, 10);
    console.log('🔗 shortCode:', shortCode);

    const existing = await pool.query(
      'SELECT 1 FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if ((existing?.rowCount ?? 0) > 0) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bu kısa kod zaten kullanımda.' }));
      return;
    }

    let expiration: Date | null = null;
    if (!isNaN(ttl) && ttl > 0) {
      expiration = new Date(Date.now() + ttl * 1000);
    }

    const urlPasswordHash = urlPassword ? await bcrypt.hash(urlPassword, 10) : null;
    const isProtected = !!urlPasswordHash;

    await pool.query(
      'INSERT INTO urls (short_code, long_url, user_id, expiration, url_password_hash, is_protected) VALUES ($1, $2, $3, $4, $5, $6)',
      [shortCode, longUrl, userId, expiration, urlPasswordHash, isProtected]
    );

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      shortUrl: `http://localhost:5000/${shortCode}`,
      expiresAt: expiration,
      isProtected
    }));

  } catch (err) {
    console.error('🚨 URL oluşturma hatası:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Sunucu hatası' }));
  }
}

/**İstek gövdesindeki (body) verileri okur ve ayrıştırır.
Kullanıcının kimlik durumunu (giriş yapmış mı, anonim mi) kontrol eder. Özellikle parola korumalı bir URL isteniyorsa, kullanıcının oturum açmış olması gerekir.
Sağlanan URL'nin geçerli olup olmadığını kontrol eder.
Kısa bir kod oluşturur (ya kullanıcıdan gelen özel kodu kullanır ya da rastgele bir tane oluşturur).
Oluşturulan kısa kodun veritabanında daha önce kullanılmadığından emin olur.
URL için bir son kullanma tarihi ve/veya parola hash'i oluşturur.
Tüm verileri veritabanına kaydeder.
Başarılı bir yanıtla birlikte kısaltılmış URL'yi geri döner.
 */