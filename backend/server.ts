import http, { IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { parse } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

import pool from './db.js';
import { handleShorten } from './routes/shorten.js';
import { handleRedirect } from './routes/redirect.js';
import { authRoutes } from './routes/authRoutes.js';
import { authMiddleware } from './middlewares/authMiddleware.js';
import { profileController } from './controllers/profileController.js';
import { urlRoutes } from './routes/myurlRoutes.js';
import { corsMiddleware } from './middlewares/corsMiddleware.js';
import { rateLimitMiddleware } from './middlewares/rateLimitMiddleware.js';

const PORT = process.env.PORT || 5000;

// Statik dosya servisi
const serveStaticFile = (res: ServerResponse, filePath: string, contentType: string) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Dosya bulunamadı.');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
};

// Veritabanı bağlantı testi
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Veritabanı bağlantısı başarılı:', res.rows[0]);
  } catch (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err);
    process.exit(1);
  }
}

// Sunucuyu başlat
async function startServer() {
  await testConnection();

  const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (corsMiddleware(req, res)) return;

    const parsedUrl = parse(req.url || '', true);
    const pathname = parsedUrl.pathname || '/';

    // 1. Şifre sayfası için özel route
    if (pathname === '/password') {
      const passwordPagePath = path.join(__dirname, '../../frontend/password.html');
      if (fs.existsSync(passwordPagePath)) {
        serveStaticFile(res, passwordPagePath, 'text/html');
        return;
      } else {
        // Eğer password.html dosyası yoksa 404 döndür
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Password sayfası bulunamadı.');
        return;
      }
    }

    // 2. Statik dosya kontrolü (frontend klasöründen servis edilir)
    const staticDirs = ['../../frontend'];
    for (const dir of staticDirs) {
      const filePath = path.join(__dirname, dir, pathname === '/' ? 'index.html' : pathname);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const contentType = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.png': 'image/png',
          '.ico': 'image/x-icon',
          '.svg': 'image/svg+xml'
        }[ext] || 'application/octet-stream';

        serveStaticFile(res, filePath, contentType);
        return;
      }
    }

    // 3. /shorten → URL kısaltma
    if (req.method === 'POST' && pathname === '/shorten') {
      if (!rateLimitMiddleware(req, res, { limit: 5, windowMs: 60000 })) return;
      await handleShorten(req, res);
      return;
    }

    // 4. /register ve /login
    const authHandled = await authRoutes(req, res);
    if (authHandled) return;

    // 5. /profile → Kimlik doğrulama + rate limit
    if (req.method === 'GET' && pathname === '/profile') {
      const isAuthorized = await authMiddleware(req, res);
      if (!isAuthorized) return;
      if (!rateLimitMiddleware(req, res, { limit: 30, windowMs: 60000 })) return;
      await profileController(req, res);
      return;
    }

    // 6. /urls → Kullanıcıya ait URL listesi
    const urlHandled = await urlRoutes(req, res);
    if (urlHandled) return;

    // 7. Kısaltılmış URL yönlendirmesi (GET ve POST şifre kontrol dahil)
    if (pathname !== '/favicon.ico') {
      await handleRedirect(req, res);
      return;
    }

    // 8. Bilinmeyen endpoint → 404
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Böyle bir endpoint bulunamadı.' }));
  });

  server.listen(PORT, () => {
    console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
  });

  // Kapanış işlemleri
  const shutdown = () => {
    console.log('🔌 Sunucu kapatılıyor...');
    server.close(() => {
      console.log('✅ Sunucu kapatıldı.');
      pool.end(() => {
        console.log('✅ Veritabanı bağlantısı kapatıldı.');
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();