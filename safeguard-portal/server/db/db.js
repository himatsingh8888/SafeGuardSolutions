import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config();

const { Pool } = pkg

const pool = new Pool({
  family: 4,
  ssl: { rejectUnauthorized: false },
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

try {
  const client = await pool.connect();
  console.log('✅ Database connected to Supabase');
  client.release(); // This puts the connection back in the pool
} catch (err) {
  console.error('❌ Database connection error:', err.message);
}

export default pool
