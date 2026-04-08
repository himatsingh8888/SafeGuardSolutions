import pool from '../db/db.js'

export async function getReviews(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                r.reviewid,
                r.reviewcomment,
                r.reviewname,
                r.rating,
                r.reviewdate,
                r.client AS clientid,
                c.fname AS client_fname,
                c.lname AS client_lname,
                c.email AS client_email
            FROM reviews r
            INNER JOIN client c ON c.clientid = r.client
            ORDER BY r.reviewdate DESC NULLS LAST, r.reviewid DESC
        `)
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch reviews' })
    }
}

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

export async function addEmployee(req, res) {
    console.log('req.body:', req.body)
    const { firstName, lastName, email, phone, wage, skills } = req.body

    try {
        const result = await pool.query(
            'INSERT INTO public.employee (fname, lname, wage, email, phonenum) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [firstName, lastName, wage, email, phone]
        )

        const newEmployee = result.rows[0]

        if (skills && skills.length > 0) {
            for (const skill of skills) {
                await pool.query(
                    'INSERT INTO public.employeeskill (employeeid, skill) VALUES ($1, $2)',
                    [newEmployee.employeeid, skill]
                )
            }
        }

        return res.status(200).json({ message: 'employee successfully added' })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: error.message })
    }
}

export async function deleteEmployee(req, res) {
    const { employeeid } = req.body
    if (!employeeid) {
        return res.status(400).json({ message: 'Missing employee id' })
    }

    try {
        await pool.query('DELETE FROM public.employee WHERE employeeid = $1', [employeeid])
        res.status(200).json({ message: 'employee succesfully deleted' })



    } catch (error) {
        res.status(400).json({ message: error })

    }

}