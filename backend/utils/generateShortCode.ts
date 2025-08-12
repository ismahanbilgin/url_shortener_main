// utils/generateShortCode.ts

import { nanoid } from 'nanoid';
import pool from '../db.js';

/**
 * Bu fonksiyon, veritabanında daha önce kullanılmamış
 * benzersiz bir kısa kod üretir.
 *
 * @param length - Üretilecek kısa kodun uzunluğu (varsayılan olarak 6 karakter)
 * @returns Promise<string> - Benzersiz bir kısa kod döndürür
 */

export async function generateShortCode(length: number = 6): Promise<string> {
  let shortCode = '';

  // isUnique değişkeni benzersiz bir kod üretilip üretilmediğini takip eder.
  let isUnique = false;

  // Kod benzersiz olana kadar döngü devam eder
  while (!isUnique) {
    shortCode = nanoid(length);

    // Veritabanında kod çakışması kontrolü
    const result = await pool.query(
      'SELECT 1 FROM urls WHERE short_code = $1 LIMIT 1',[shortCode]);

    // Eğer sonuç satır sayısı 0 ise bu kısa kod daha önce kullanılmamıştır
    if (result.rowCount === 0) {
      isUnique = true; // Döngüden çıkmak için
    }
    // Aksi takdirde döngü devam eder ve yeni bir kod üretilir
  }

  // Benzersiz kodu döndürüyoruz
  return shortCode;
}
