import mysql from 'mysql2/promise';


const pool = mysql.createPool(process.env.DATABASE_URL + '?ssl={"rejectUnauthorized":true}');

export async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

export default pool;