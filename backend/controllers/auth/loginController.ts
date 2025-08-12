import { loginUser } from '../../services/authService.js';
import { parseRequestBody } from '../../utils/parseRequestBody.js';
import http from 'http';

/**
 * Kullanıcı giriş isteğini işler
 */
export async function loginController(req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    const { email, password } = await parseRequestBody(req);

    // Zorunlu alan kontrolü
    if (!email || !password) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Email ve şifre gereklidir.' }));
      return;
    }

    // Giriş işlemi (token üretimi)
    const token = await loginUser(email, password);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Giriş başarılı.', token }));
  } catch (err: unknown) { // 'any' yerine 'unknown' kullanıldı

    // Hatanın bir 'Error' nesnesi olup olmadığını kontrol et
    if (err instanceof Error) {
      console.error('Giriş hatası:', err.message);

      if (err.message === 'Kullanıcı bulunamadı' || err.message === 'Şifre yanlış') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email veya şifre yanlış.' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Sunucu hatası. Lütfen tekrar deneyin.' }));
      }
    } else {
      // Eğer hata nesnesi değilse, genel bir sunucu hatası dönelim
      console.error('Bilinmeyen bir hata oluştu:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Sunucu hatası. Lütfen tekrar deneyin.' }));
    }
  }
}
