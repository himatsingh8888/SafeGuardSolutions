import bcrypt from 'bcrypt'
import pool from './db/db.js'


const username = 'admin'
const password = 'yourpasswordhere'
const name = 'Admin'
const email = 'admin@safeguard.com'

const hashedPassword = await bcrypt.hash(password, 10)

await pool.query(
  'INSERT INTO public.users (name, email, username, password, role) VALUES ($1, $2, $3, $4, $5)',
  [name, email, username, hashedPassword, 'admin']
)

console.log('Admin user created successfully')
process.exit()