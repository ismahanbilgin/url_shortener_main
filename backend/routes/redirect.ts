import http from 'http';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import { incrementClickCount } from '../utils/clickCounter.js';
import { parseRequestBody } from '../utils/parseRequestBody.js';

export async function handleRedirect(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  try {
    const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
    const shortCode = parsedUrl.pathname.slice(1);

    // Sadece geçerli kısa kodlar işlenmeli bunun için regex ifade
    if (!/^[a-zA-Z0-9-]{6,10}$/.test(shortCode)) {
      console.warn(`⛔ Geçersiz shortCode formatı: '${shortCode}'`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Geçersiz kısa kod' }));
      return;
    }

    console.log('📥 Gelen redirect isteği. shortCode:', shortCode);

    if (!shortCode) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Kısa kod gerekli' }));
      return;
    }

    const result = await pool.query<{
      long_url: string,
      expiration: string | null,
      url_password_hash: string | null,
      is_protected: boolean
    }>(
      'SELECT long_url, expiration, url_password_hash, is_protected FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (result.rows.length === 0) {
      console.warn(`❌ short_code '${shortCode}' ile eşleşen URL bulunamadı.`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Kısa URL bulunamadı' }));
      return;
    }

    const { long_url: longUrl, expiration, url_password_hash, is_protected } = result.rows[0];

    const now = new Date();
    const isExpired = expiration ? now > new Date(expiration) : false;

    if (isExpired) {
      console.warn(`⚠️ shortCode '${shortCode}' süresi dolmuş.`);
      res.writeHead(410, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bu URL\'nin süresi dolmuştur.' }));
      return;
    }

    if (is_protected) {
      console.log(`🔒 Şifre korumalı URL. İstek metodu: ${req.method}`);

      if (req.method === 'GET') {
        // Tarayıcı isteği - şifre sayfasına yönlendir
        console.log('🌐 Tarayıcı GET isteği → Şifre sayfasına yönlendiriliyor');
        const userAgent = req.headers['user-agent'] || '';
        
        // API isteklerini (fetch, XMLHttpRequest) tespit et
        const isApiRequest = req.headers['accept']?.includes('application/json') ||
                           req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                           userAgent.toLowerCase().includes('fetch');

        if (isApiRequest) {
          // API isteği - JSON yanıtı döndür (mevcut davranış)
          console.log('📝 API GET → JSON yanıtı gönderiliyor');
          res.writeHead(401, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            Pragma: 'no-cache'
          });
          res.end(JSON.stringify({
            requiresPassword: true,
            shortCode,
            isProtected: true
          }));
          return;
        } else {
          // Tarayıcı isteği - şifre sayfasına yönlendir
          res.writeHead(302, {
            Location: `/password?code=${shortCode}`,
            'Cache-Control': 'no-store',
            Pragma: 'no-cache'
          });
          res.end();
          return;
        }
      }

      if (req.method === 'POST') {
        console.log('📥 POST → Şifre doğrulama aşamasına geçiliyor...');
        const data = await parseRequestBody(req);
        console.log('📦 Gelen body:', { ...data, password: '[GİZLİ]' });

        const urlPassword = data.password;

        if (!urlPassword) {
          console.warn('⚠️ Şifre girilmedi.');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Şifre gerekli' }));
          return;
        }

        if (!url_password_hash) {
          console.error('❌ Veritabanında şifre hash bulunamadı!');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Şifre kontrolü yapılamadı' }));
          return;
        }

        console.log('🔄 Şifre hash ile karşılaştırılıyor...');
        const isMatch = await bcrypt.compare(urlPassword, url_password_hash);
        console.log(`✅ Karşılaştırma sonucu: ${isMatch}`);

        if (!isMatch) {
          console.warn('❌ Girilen şifre yanlış.');
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Şifre yanlış' }));
          return;
        }

        await incrementClickCount(shortCode);
        console.log(`🎯 Şifre doğru → longUrl gönderiliyor: ${longUrl}`);

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          Pragma: 'no-cache'
        });
        res.end(JSON.stringify({ longUrl }));
        return;
      }

      // Diğer HTTP metodları desteklenmiyor
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Yalnızca GET ve POST destekleniyor' }));
      return;
    }

    // Şifre koruması yoksa → doğrudan yönlendir
    await incrementClickCount(shortCode);
    console.log(`🔁 Şifresiz yönlendirme: ${longUrl}`);

    res.writeHead(302, {
      Location: longUrl,
      'Cache-Control': 'no-store',
      Pragma: 'no-cache'
    });
    res.end();

  } catch (err) {
    console.error('❌ Redirect hatası:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Sunucu hatası' }));
  }
}