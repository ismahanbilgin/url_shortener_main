import { IncomingMessage, ServerResponse } from 'http';
import { parseRequestBody } from '../../utils/parseRequestBody.js';
import { registerUser } from '../../services/authService.js';

/**
 * Kullanıcı kayıt işlemini yönetir
 */
export async function registerController(req: IncomingMessage, res: ServerResponse) {
  try {
    const { email, password, username } = await parseRequestBody(req);

    // Zorunlu alanlar kontrolü
    if (!email || !password || !username) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Email, kullanıcı adı ve şifre gereklidir.' }));
      return;
    }

    // Kullanıcıyı kaydet
    const user = await registerUser(email, password, username);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Kayıt başarılı.', userId: user.id }));

  } catch (err: unknown) { // 'any' yerine 'unknown' kullanıldı
    console.error('Kayıt sırasında hata:', err);

    // Hatanın bir obje olduğunu ve 'code' özelliğine sahip olduğunu kontrol et
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      err.code === '23505' // PostgreSQL unique constraint ihlali
    ) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bu email veya kullanıcı adı zaten kayıtlı.' }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Sunucu hatası. Lütfen tekrar deneyin.' }));
    }
  }
}
