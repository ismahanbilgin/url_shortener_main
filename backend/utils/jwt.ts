import jwt from 'jsonwebtoken';

//secret, token üretirken ve doğrularken kullanılan gizli anahtar. 
const SECRET = process.env.JWT_SECRET!;

export function generateToken(userId: string): string {
    return jwt.sign({ userId }, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string } {
    const decoded = jwt.verify(token, SECRET) as { userId: string };
    return { userId: decoded.userId };
}