import pool from '../db/db.js'

export async function getEmployees(req, res) {
    try {
        const result = await pool.query(
            `SELECT e.*, array_agg(es.skill) as skills
            FROM employee e
            LEFT JOIN employeeskill es ON e.employeeid = es.employeeid
            GROUP BY e.employeeid`)

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No employees found' })
        }

        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch employees' })
    }
}