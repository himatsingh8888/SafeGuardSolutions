import pool from '../db/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()

// POST /api/client-auth/login
export async function loginClient(req, res) {
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' })
    }
    try {
        // JOIN: client_auth + client to get identity
        const result = await pool.query(
            `SELECT ca.clientid, ca.password, c.fname, c.lname
             FROM public.client_auth ca
             JOIN public.client c ON ca.clientid = c.clientid
             WHERE ca.username = $1`,
            [username.trim()]
        )
        const row = result.rows[0]
        if (!row) return res.status(401).json({ message: 'Invalid credentials' })

        const match = await bcrypt.compare(password, row.password)
        if (!match) return res.status(401).json({ message: 'Invalid credentials' })

        const token = jwt.sign(
            { id: row.clientid, role: 'client' },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        )
        return res.json({ token, clientId: row.clientid, fname: row.fname, lname: row.lname })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Database error' })
    }
}

// GET /api/client-auth/me
// JOIN: client + client_auth + location 
export async function getMyProfile(req, res) {
    const clientId = req.clientId
    try {
        const result = await pool.query(
            `SELECT c.clientid, c.fname, c.lname, c.billingaddress, c.customertype,
                    c.email, c.phone, ca.username,
                    COALESCE(
                      json_agg(
                        DISTINCT jsonb_build_object('siteid', l.siteid, 'address', l.address, 'description', l.description)
                      ) FILTER (WHERE l.siteid IS NOT NULL),
                      '[]'
                    ) AS locations
             FROM public.client c
             JOIN public.client_auth ca ON ca.clientid = c.clientid
             LEFT JOIN public.location l ON l.client = c.clientid
             WHERE c.clientid = $1
             GROUP BY c.clientid, ca.username`,
            [clientId]
        )
        if (!result.rows.length) return res.status(404).json({ message: 'Client not found' })
        return res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Database error' })
    }
}

function normStr(v) {
    return String(v ?? '').trim()
}

// PUT /api/client-auth/profile
// UPDATE: fname, lname, email, billingaddress, phone
// Optional body.expected = { fname, lname, email, billingaddress, phone } — if present and DB row
// differs, respond 409 so the client can refresh (same idea as employee stale flows).
export async function updateMyProfile(req, res) {
    const clientId = req.clientId
    const { fname, lname, email, billingaddress, phone, expected } = req.body
    if (!fname && !lname && !email && !billingaddress && !phone) {
        return res.status(400).json({ message: 'At least one field is required' })
    }
    if (email && !/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ message: 'Invalid email address' })
    }
    try {
        if (expected && typeof expected === 'object') {
            const cur = await pool.query(
                `SELECT fname, lname, email, billingaddress, phone FROM public.client WHERE clientid = $1`,
                [clientId]
            )
            if (!cur.rows.length) return res.status(404).json({ message: 'Client not found' })
            const row = cur.rows[0]
            const fields = ['fname', 'lname', 'email', 'billingaddress', 'phone']
            for (const f of fields) {
                if (normStr(row[f]) !== normStr(expected[f])) {
                    return res.status(409).json({
                        message:
                            'Your profile was changed elsewhere. Please review the updated data and try again.',
                    })
                }
            }
        }

        const result = await pool.query(
            `UPDATE public.client
             SET fname          = COALESCE($1, fname),
                 lname          = COALESCE($2, lname),
                 email          = COALESCE($3, email),
                 billingaddress = COALESCE($4, billingaddress),
                 phone          = COALESCE($5, phone)
             WHERE clientid = $6
             RETURNING clientid, fname, lname, billingaddress, customertype, email, phone`,
            [fname || null, lname || null, email || null, billingaddress || null, phone || null, clientId]
        )
        if (!result.rowCount) return res.status(404).json({ message: 'Client not found' })
        return res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Database error' })
    }
}

// GET /api/client-auth/installations
// JOIN: location + installation + servicevisit 
export async function getMyInstallations(req, res) {
    const clientId = req.clientId
    try {
        const result = await pool.query(
            `SELECT i.installationid, i.scheduleddate, i.completeddate, i.status,
                    i.description, i.price, i.techniciannumbs,
                    l.address AS siteaddress,
                    COUNT(sv.visitnumber) AS visit_count
             FROM public.installation i
             JOIN public.location l ON i.siteid = l.siteid
             LEFT JOIN public.servicevisit sv ON sv.installationid = i.installationid
             WHERE l.client = $1
             GROUP BY i.installationid, l.address
             ORDER BY i.scheduleddate DESC`,
            [clientId]
        )
        return res.json(result.rows)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Database error' })
    }
}

// DELETE /api/client-auth/installations/:id
// CASCADE DELETE: deleting installation cascades to servicevisit, assignment, installusage
export async function cancelInstallation(req, res) {
    const clientId = req.clientId
    const { id } = req.params
    try {
        const check = await pool.query(
            `SELECT i.installationid, i.status
             FROM public.installation i
             JOIN public.location l ON i.siteid = l.siteid
             WHERE i.installationid = $1 AND l.client = $2`,
            [id, clientId]
        )
        if (!check.rows.length) return res.status(404).json({ message: 'Installation not found' })
        if (check.rows[0].status !== 'Scheduled') {
            return res.status(400).json({ message: 'Only Scheduled installations can be cancelled' })
        }
        await pool.query('DELETE FROM public.installation WHERE installationid = $1', [id])
        return res.json({ message: 'Installation cancelled. Related service visits and assignments removed via cascade.' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Database error' })
    }
}

// GET /api/client-auth/payments
// JOIN: payment for this client
export async function getMyPayments(req, res) {
    const clientId = req.clientId
    try {
        const result = await pool.query(
            `SELECT paymentid, status, duedate, createdate, totalamount, paymenttype
             FROM public.payment
             WHERE client = $1
             ORDER BY createdate DESC`,
            [clientId]
        )
        return res.json(result.rows)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Database error' })
    }
}

// GET /api/client-auth/payment-summary
// AGGREGATION: SUM, AVG, MIN, MAX, COUNT on client's payments
export async function getPaymentSummary(req, res) {
    const clientId = req.clientId
    try {
        const result = await pool.query(
            `SELECT
               COUNT(*)                                               AS total_count,
               COALESCE(SUM(totalamount), 0)                         AS total_amount,
               COALESCE(ROUND(AVG(totalamount)::numeric, 2), 0)      AS avg_amount,
               COALESCE(MIN(totalamount), 0)                         AS min_amount,
               COALESCE(MAX(totalamount), 0)                         AS max_amount,
               COUNT(*) FILTER (WHERE status = 'Pending')            AS pending_count,
               COUNT(*) FILTER (WHERE status = 'Paid')               AS paid_count,
               COUNT(*) FILTER (WHERE status = 'Overdue')            AS overdue_count
             FROM public.payment
             WHERE client = $1`,
            [clientId]
        )
        return res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Database error' })
    }
}

// GET /api/client-auth/payment-breakdown
// AGGREGATION + GROUP BY: payment stats grouped by status
export async function getPaymentBreakdown(req, res) {
    const clientId = req.clientId
    try {
        const result = await pool.query(
            `SELECT status,
                    COUNT(*)                                          AS count,
                    COALESCE(SUM(totalamount), 0)                    AS total,
                    COALESCE(ROUND(AVG(totalamount)::numeric, 2), 0) AS avg_amount,
                    COALESCE(MIN(totalamount), 0)                    AS min_amount,
                    COALESCE(MAX(totalamount), 0)                    AS max_amount
             FROM public.payment
             WHERE client = $1
             GROUP BY status
             ORDER BY status`,
            [clientId]
        )
        return res.json(result.rows)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Database error' })
    }
}

// GET /api/client-auth/similar-clients
// DIVISION: find other clients who have had ALL the same service visit types as the logged-in client
export async function getSimilarClients(req, res) {
    const clientId = req.clientId
    try {
        const result = await pool.query(
            `SELECT c.clientid, c.fname, c.lname, c.customertype,
                    array_agg(DISTINCT sv3.visittype ORDER BY sv3.visittype) AS shared_types
             FROM public.client c
             JOIN public.location l3 ON l3.client = c.clientid
             JOIN public.installation i3 ON i3.siteid = l3.siteid
             JOIN public.servicevisit sv3 ON sv3.installationid = i3.installationid
             WHERE c.clientid != $1
               AND NOT EXISTS (
                   SELECT DISTINCT sv1.visittype
                   FROM public.servicevisit sv1
                   JOIN public.installation i1 ON sv1.installationid = i1.installationid
                   JOIN public.location l1 ON i1.siteid = l1.siteid
                   WHERE l1.client = $1
                   AND sv1.visittype NOT IN (
                       SELECT DISTINCT sv2.visittype
                       FROM public.servicevisit sv2
                       JOIN public.installation i2 ON sv2.installationid = i2.installationid
                       JOIN public.location l2 ON i2.siteid = l2.siteid
                       WHERE l2.client = c.clientid
                   )
               )
             GROUP BY c.clientid, c.fname, c.lname, c.customertype
             ORDER BY c.fname`,
            [clientId]
        )
        return res.json(result.rows)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Database error' })
    }
}
