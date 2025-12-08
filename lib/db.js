import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST || 'aws.connect.psdb.cloud',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || 'recipe_hub',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true
  }
};

const pool = mysql.createPool(dbConfig);

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