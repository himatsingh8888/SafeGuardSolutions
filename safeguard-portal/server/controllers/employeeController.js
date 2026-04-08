import pool from '../db/db.js'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

// Auth
export async function loginEmployee(req, res) {
    const { email, phone } = req.body

    if (!email || !phone) {
        return res.status(400).json({ message: 'Email and phone are required' })
    }

    try {
        const result = await pool.query(
            'SELECT * FROM public.employee WHERE email = $1 AND phonenum = $2',
            [email.trim(), phone.trim()]
        )

        const employee = result.rows[0]
        if (!employee) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const token = jwt.sign(
            { id: employee.employeeid, role: 'employee' },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        )

        return res.json({ token, role: 'employee', employeeId: employee.employeeid })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Database error' })
    }
}

// JOIN: employee + employeeskill (LEFT JOIN to include employees with no skills)
export async function getMyProfile(req, res) {
    const employeeId = req.employeeId

    try {
        const result = await pool.query(
            `SELECT e.employeeid, e.fname, e.lname, e.wage, e.email, e.phonenum,
                    COALESCE(array_agg(es.skill ORDER BY es.skill) FILTER (WHERE es.skill IS NOT NULL), '{}') AS skills
             FROM public.employee e
             LEFT JOIN public.employeeskill es ON e.employeeid = es.employeeid
             WHERE e.employeeid = $1
             GROUP BY e.employeeid`,
            [employeeId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' })
        }

        return res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch profile' })
    }
}

// JOIN: assignment + installation + location (3-table join)
export async function getMyAssignments(req, res) {
    const employeeId = req.employeeId

    try {
        const result = await pool.query(
            `SELECT a.installationid, a.hoursworked,
                    i.scheduleddate, i.completeddate, i.description, i.status,
                    i.price, i.techniciannumbs,
                    l.address AS siteaddress
             FROM public.assignment a
             JOIN public.installation i ON a.installationid = i.installationid
             JOIN public.location l ON i.siteid = l.siteid
             WHERE a.employeeid = $1
             ORDER BY i.scheduleddate DESC`,
            [employeeId]
        )

        return res.json(result.rows)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch assignments' })
    }
}

// JOIN: servicevisit + assignment + installation + location
export async function getMyServiceVisits(req, res) {
    const employeeId = req.employeeId

    try {
        const result = await pool.query(
            `SELECT sv.visitnumber, sv.installationid, sv.visitdate,
                    sv.visittype, sv.notes, sv.outcomestatus,
                    l.address AS siteaddress
             FROM public.servicevisit sv
             JOIN public.assignment a ON sv.installationid = a.installationid
             JOIN public.installation i ON sv.installationid = i.installationid
             JOIN public.location l ON i.siteid = l.siteid
             WHERE a.employeeid = $1
             ORDER BY sv.visitdate DESC`,
            [employeeId]
        )

        return res.json(result.rows)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch service visits' })
    }
}

// AGGREGATION: COUNT, SUM, AVG, MIN, MAX on hours worked
export async function getMyStats(req, res) {
    const employeeId = req.employeeId

    try {
        const result = await pool.query(
            `SELECT
                COUNT(*) AS total_jobs,
                COALESCE(SUM(hoursworked), 0) AS total_hours,
                COALESCE(ROUND(AVG(hoursworked), 2), 0) AS avg_hours,
                COALESCE(MIN(hoursworked), 0) AS min_hours,
                COALESCE(MAX(hoursworked), 0) AS max_hours
             FROM public.assignment
             WHERE employeeid = $1`,
            [employeeId]
        )

        return res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch stats' })
    }
}

// AGGREGATION + GROUP BY: job count and hours grouped by installation status
export async function getJobBreakdown(req, res) {
    const employeeId = req.employeeId

    try {
        const result = await pool.query(
            `SELECT i.status,
                    COUNT(a.installationid) AS job_count,
                    COALESCE(SUM(a.hoursworked), 0) AS total_hours,
                    COALESCE(ROUND(AVG(a.hoursworked), 2), 0) AS avg_hours
             FROM public.assignment a
             JOIN public.installation i ON a.installationid = i.installationid
             WHERE a.employeeid = $1
             GROUP BY i.status
             ORDER BY i.status`,
            [employeeId]
        )

        return res.json(result.rows)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch job breakdown' })
    }
}

// DIVISION: find employees who have ALL of the current employee's skills
// "Colleagues who cover your full skill set"
export async function getSkillMatchedColleagues(req, res) {
    const employeeId = req.employeeId

    try {
        const result = await pool.query(
            `SELECT e.employeeid, e.fname, e.lname,
                    array_agg(es.skill ORDER BY es.skill) AS skills
             FROM public.employee e
             JOIN public.employeeskill es ON e.employeeid = es.employeeid
             WHERE e.employeeid != $1
               AND NOT EXISTS (
                   SELECT es2.skill
                   FROM public.employeeskill es2
                   WHERE es2.employeeid = $1
                   AND es2.skill NOT IN (
                       SELECT es3.skill
                       FROM public.employeeskill es3
                       WHERE es3.employeeid = e.employeeid
                   )
               )
             GROUP BY e.employeeid, e.fname, e.lname
             ORDER BY e.fname`,
            [employeeId]
        )

        return res.json(result.rows)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch skill matches' })
    }
}

// CASCADE DELETE: delete a scheduled installation the employee is assigned to.
// Cascades to: assignment, servicevisit, installusage
export async function cancelJob(req, res) {
    const employeeId = req.employeeId
    const { installationid } = req.params

    try {
        const assignCheck = await pool.query(
            `SELECT a.installationid, i.status
             FROM public.assignment a
             JOIN public.installation i ON a.installationid = i.installationid
             WHERE a.employeeid = $1 AND a.installationid = $2`,
            [employeeId, installationid]
        )

        if (assignCheck.rows.length === 0) {
            return res.status(403).json({ message: 'You are not assigned to this job' })
        }

        const job = assignCheck.rows[0]
        if (job.status !== 'Scheduled') {
            return res.status(400).json({ message: 'Only Scheduled jobs can be cancelled' })
        }

        // Deleting installation cascades to: assignment, servicevisit, installusage
        await pool.query(
            'DELETE FROM public.installation WHERE installationid = $1',
            [installationid]
        )

        return res.json({ message: 'Job cancelled. Assignments and service visits removed via cascade.' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to cancel job' })
    }
}

// UPDATE: employee updates their own phone number
export async function updateMyProfile(req, res) {
    const employeeId = req.employeeId
    const { phonenum } = req.body

    if (!phonenum || String(phonenum).trim().length < 7) {
        return res.status(400).json({ message: 'Please provide a valid phone number (min 7 digits)' })
    }

    try {
        const result = await pool.query(
            `UPDATE public.employee SET phonenum = $1 WHERE employeeid = $2 RETURNING phonenum`,
            [phonenum.trim(), employeeId]
        )

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Employee not found' })
        }

        return res.json({ message: 'Phone number updated successfully', phonenum: result.rows[0].phonenum })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to update profile' })
    }
}
