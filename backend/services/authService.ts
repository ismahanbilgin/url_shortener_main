import bcrypt from 'bcrypt';
import pool from '../db.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Yeni kullanıcıyı kaydeder.
 * @param email 
 * @param password 
 * @param username
 * @returns Kayıt edilen kullanıcının bilgisi
 */
export async function registerUser(email: string, password: string, username: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO users (email, hashed_password, username)
         VALUES ($1, $2, $3)
         RETURNING id, email, username`,
        [email, hashedPassword, username]
    );

    return result.rows[0]; // { id, email, username }
}

/**
 * Kullanıcı girişini kontrol eder ve JWT token döner.
 * @param email 
 * @param password 
 * @returns JWT token string
 */
export async function loginUser(email: string, password: string) {
    const result = await pool.query(
        'SELECT id, hashed_password FROM users WHERE email = $1',
        [email]
    );

    const user = result.rows[0];
    if (!user) throw new Error('Kullanıcı bulunamadı');

    const isMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isMatch) throw new Error('Şifre yanlış');

    return generateToken(user.id); // Token döner
}
