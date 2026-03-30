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

export async function updateEmployee(req, res) {
    const { firstName, lastName, email, phone, wage, employeeid, skills } = req.body

    try {
        // Update the employee record
        const result = await pool.query(
            `UPDATE public.employee 
             SET fname = $1, lname = $2, email = $3, phonenum = $4, wage = $5
             WHERE employeeid = $6
             RETURNING *`,
            [firstName, lastName, email, phone, wage, employeeid]
        )

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Employee not found' })
        }

        // Delete existing skills and re-insert updated ones
        await pool.query(
            'DELETE FROM public.employeeskill WHERE employeeid = $1',
            [employeeid]
        )

        if (skills && skills.length > 0) {
            for (const skill of skills) {
                await pool.query(
                    'INSERT INTO public.employeeskill (employeeid, skill) VALUES ($1, $2)',
                    [employeeid, skill]
                )
            }
        }

        return res.status(200).json({ message: 'Employee updated successfully' })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: error.message })
    }
}