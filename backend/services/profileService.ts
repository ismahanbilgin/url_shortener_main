import pool from '../db.js';

export async function getUserUrls(userId: number) {
  const { rows } = await pool.query(
    'SELECT id, original_url, short_code, click_count FROM urls WHERE user_id = $1',
    [userId]
  );
  return rows;
}
