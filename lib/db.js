import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'maglev.proxy.rlwy.net',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'vmyqVCCFwrztrNnakkTsgBxMpXDnIpPK',
  database: process.env.MYSQL_DATABASE || 'recipe_hub',
  port: 22086,
  ssl: {
    rejectUnauthorized: false
  }
});

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