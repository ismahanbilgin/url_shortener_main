import pool from '../db.js';

export async function incrementClickCount(shortCode: string): Promise<void> {
  try {
    console.log(`🔁 click_count artırma işlemi başlatıldı → shortCode: '${shortCode}'`);

    const result = await pool.query(
      'UPDATE urls SET click_count = click_count + 1 WHERE short_code = $1 RETURNING click_count',
      [shortCode]
    );

    if (result.rowCount === 0) {
      console.warn(`⚠️ click_count artırılamadı: short_code '${shortCode}' bulunamadı.`);
    } else {
      console.log(`✅ click_count güncellendi → Yeni değer: ${result.rows[0].click_count}`);
    }
  } catch (err) {
    console.error('❌ click_count artırılırken hata oluştu:', err);
    throw err;
  }
}
