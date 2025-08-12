import { IncomingMessage } from 'http';

export interface UserPayload {
  userId: string; // token'dan gelen userId tipine göre string veya number olabilir
  // Diğer kullanıcı bilgileri varsa onları da ekleyebilirsin
}

export interface CustomRequest extends IncomingMessage {
  user?: UserPayload | null;
}
