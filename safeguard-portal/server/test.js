import pool from './db/db.js'

console.log('HOST:', process.env.DATABASE_HOST)
console.log('PORT:', process.env.DATABASE_PORT)
console.log('USER:', process.env.DATABASE_USER)
console.log('DB:', process.env.DATABASE_NAME)
const result = await pool.query('SELECT * FROM public.users')
console.log(result.rows)
process.exit()

