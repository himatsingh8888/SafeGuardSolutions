import pool from '../db/db.js'

export async function getEmployeesAllSkills(req, res) {
    try {
        const result = await pool.query(`
            SELECT e.employeeid, e.fname, e.lname, e.wage, e.email, e.phonenum,
            ARRAY_AGG(es.skill) AS skills
            FROM employee e
            JOIN employeeskill es ON e.employeeid = es.employeeid
            WHERE NOT EXISTS(
                SELECT skill FROM(VALUES
                    ('Camera Installation'),
                    ('Alarm Systems'),
                    ('Access Control'),
                    ('Network Setup')
                ) AS required_skills(skill)
                EXCEPT
                SELECT skill FROM employeeskill WHERE employeeid = e.employeeid
            )
            GROUP BY e.employeeid, e.fname, e.lname, e.wage, e.email, e.phonenum`
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No employees with all skills found' })
        }

        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch employees' })
    }
}



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

        res.json(result.rows.length === 0 ? [] : result.rows)
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

// Inventory CRUD Operations
export async function getInventory(req, res) {
    try {
        const result = await pool.query('SELECT * FROM public.inventory ORDER BY inventoryid')
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch inventory' })
    }
}

export async function addInventory(req, res) {
    const { itemType, supplierCompany, quantity, dateOfPurchase, warranty } = req.body

    try {
        await pool.query(
            'INSERT INTO public.inventory (itemtype, suppliercompany, quantity, dateofpurchase, warranty) VALUES ($1, $2, $3, $4, $5)',
            [itemType, supplierCompany, quantity, dateOfPurchase, warranty || null]
        )
        return res.status(200).json({ message: 'Inventory item successfully added' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: error.message })
    }
}

export async function deleteInventory(req, res) {
    const { inventoryid } = req.body
    if (!inventoryid) {
        return res.status(400).json({ message: 'Missing inventory id' })
    }

    try {
        await pool.query('DELETE FROM public.inventory WHERE inventoryid = $1', [inventoryid])
        res.status(200).json({ message: 'Inventory item successfully deleted' })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export async function updateInventory(req, res) {
    const { itemType, supplierCompany, quantity, dateOfPurchase, warranty, inventoryid } = req.body

    try {
        const result = await pool.query(
            `UPDATE public.inventory 
             SET itemtype = $1, suppliercompany = $2, quantity = $3, dateofpurchase = $4, warranty = $5
             WHERE inventoryid = $6
             RETURNING *`,
            [itemType, supplierCompany, quantity, dateOfPurchase, warranty || null, inventoryid]
        )

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Inventory item not found' })
        }

        return res.status(200).json({ message: 'Inventory item updated successfully' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: error.message })
    }
}

// Quote Request CRUD Operations
export async function updateQuoteRequest(req, res) {
    const { requestid, status } = req.body

    try {
        const result = await pool.query(
            `UPDATE public.quoterequest 
             SET status = $1
             WHERE requestid = $2`,
            [status, requestid]
        )

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Quote request not found' })
        }

        return res.status(200).json({ message: 'Quote request updated successfully' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: error.message })
    }
}

export async function deleteQuoteRequest(req, res) {
    const { requestid } = req.body
    if (!requestid) {
        return res.status(400).json({ message: 'Missing request id' })
    }

    try {
        await pool.query('DELETE FROM public.quoterequest WHERE requestid = $1', [requestid])
        res.status(200).json({ message: 'Quote request deleted successfully' })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export async function getClients(req, res) {
    try {
        const result = await pool.query('SELECT * FROM client')

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No clients found' })
        }

        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch clients' })
    }
}

export async function addClient(req, res) {
    try {
        const { firstName, lastName, email, phone, billingaddress, customertype } = req.body

        const result = await pool.query(
            'INSERT INTO client (fname, lname, email, phone, billingaddress, customertype) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [firstName, lastName, email, phone, billingaddress, customertype]
        )

        res.status(201).json({ message: 'Client added successfully', client: result.rows[0] })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to add client' })
    }
}

export async function deleteClient(req, res) {
    const { clientid } = req.body
    if (clientid == null || clientid === '') {
        return res.status(400).json({ message: 'clientid is required' })
    }

    const c = await pool.connect()
    try {
        await c.query('BEGIN')
        // Installations reference location(siteid); remove them first so locations can go.
        await c.query(
            `DELETE FROM public.installation i
             USING public.location l
             WHERE i.siteid = l.siteid AND l.client = $1`,
            [clientid]
        )
        await c.query('DELETE FROM public.location WHERE client = $1', [clientid])
        await c.query('DELETE FROM public.payment WHERE client = $1', [clientid])
        await c.query('DELETE FROM public.reviews WHERE client = $1', [clientid])
        // client_auth has ON DELETE CASCADE from client — no separate delete needed.
        const result = await c.query('DELETE FROM public.client WHERE clientid = $1 RETURNING *', [clientid])
        await c.query('COMMIT')

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Client not found' })
        }

        res.json({ message: 'Client deleted successfully' })
    } catch (err) {
        try {
            await c.query('ROLLBACK')
        } catch (_) {
            /* no active transaction */
        }
        console.error(err)
        const msg = err.code === '23503' ? 'Cannot delete client: related data still references this client.' : err.message
        res.status(500).json({ error: 'Failed to delete client', detail: msg })
    } finally {
        c.release()
    }
}

export async function updateClient(req, res) {
    try {
        const { firstName, lastName, email, phone, billingaddress, customertype, clientid } = req.body

        const result = await pool.query(
            'UPDATE client SET fname=$1, lname=$2, email=$3, phone=$4, billingaddress=$5, customertype=$6 WHERE clientid=$7 RETURNING *',
            [firstName, lastName, email, phone, billingaddress, customertype, clientid]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Client not found' })
        }

        res.json({ message: 'Client updated successfully', client: result.rows[0] })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to update client' })
    }
}

export async function getInstallations(req, res) {
    try {
        const result = await pool.query(`
            SELECT * FROM installation
            ORDER BY scheduleddate DESC
        `)
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch installations' })
    }
}

export async function updateInstallationStatus(req, res) {
    const { installationid, status } = req.body

    try {
        // Schema CHECKs: completeddate >= scheduleddate, and scheduleddate >= CURRENT_DATE.
        // Plain "completeddate = CURRENT_DATE" breaks when scheduleddate is in the future
        // (completed before scheduled) or when scheduleddate is in the past (row fails the
        // scheduleddate check on UPDATE). Use GREATEST so both constraints hold.
        let query
        const params = [status]

        if (status === 'Completed') {
            query = `
                UPDATE public.installation
                SET status = $1,
                    scheduleddate = GREATEST(scheduleddate, CURRENT_DATE),
                    completeddate = GREATEST(CURRENT_DATE, scheduleddate)
                WHERE installationid = $2
                RETURNING *
            `
        } else {
            query = `
                UPDATE public.installation
                SET status = $1
                WHERE installationid = $2
                RETURNING *
            `
        }
        params.push(installationid)

        const result = await pool.query(query, params)

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Installation not found' })
        }

        res.json({
            message: 'Installation status updated successfully',
            installation: result.rows[0],
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            error: 'Failed to update installation status',
            detail: err.message,
        })
    }
}

export async function getLocations(req, res) {
    try {
        const result = await pool.query(`
            SELECT l.siteid, l.address, l.description, l.client,
                   c.fname, c.lname
            FROM public.location l
            JOIN public.client c ON c.clientid = l.client
            ORDER BY l.siteid
        `)
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch locations' })
    }
}

function normalizeEmployeeIds(body) {
    const raw = body?.employeeIds
    const arr = Array.isArray(raw) ? raw : []
    return [...new Set(arr.map((x) => parseInt(String(x), 10)).filter((n) => !Number.isNaN(n) && n > 0))]
}

async function assertEmployeesExist(client, employeeIds) {
    if (employeeIds.length === 0) return true
    const r = await client.query(
        'SELECT COUNT(*)::int AS c FROM public.employee WHERE employeeid = ANY($1::int[])',
        [employeeIds]
    )
    return r.rows[0].c === employeeIds.length
}

export async function getInstallationAssignments(req, res) {
    const installationid = parseInt(String(req.query.installationid ?? ''), 10)
    if (Number.isNaN(installationid) || installationid <= 0) {
        return res.status(400).json({ message: 'installationid is required' })
    }
    try {
        const r = await pool.query(
            'SELECT employeeid FROM public.assignment WHERE installationid = $1 ORDER BY employeeid',
            [installationid]
        )
        return res.json({ employeeIds: r.rows.map((row) => row.employeeid) })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'Failed to fetch assignments', detail: err.message })
    }
}

export async function setInstallationAssignments(req, res) {
    const installationid = parseInt(String(req.body?.installationid ?? ''), 10)
    const employeeIds = normalizeEmployeeIds(req.body)

    if (Number.isNaN(installationid) || installationid <= 0) {
        return res.status(400).json({ message: 'installationid is required' })
    }

    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        const inst = await client.query(
            'SELECT installationid FROM public.installation WHERE installationid = $1',
            [installationid]
        )
        if (inst.rowCount === 0) {
            await client.query('ROLLBACK')
            return res.status(404).json({ message: 'Installation not found' })
        }

        if (employeeIds.length > 0) {
            const ok = await assertEmployeesExist(client, employeeIds)
            if (!ok) {
                await client.query('ROLLBACK')
                return res.status(400).json({ message: 'One or more employee ids are invalid' })
            }
        }

        await client.query('DELETE FROM public.assignment WHERE installationid = $1', [installationid])

        for (const eid of employeeIds) {
            await client.query(
                'INSERT INTO public.assignment (employeeid, installationid, hoursworked) VALUES ($1, $2, 0)',
                [eid, installationid]
            )
        }

        await client.query(
            'UPDATE public.installation SET techniciannumbs = $1 WHERE installationid = $2',
            [employeeIds.length, installationid]
        )

        await client.query('COMMIT')
        return res.json({
            message: 'Technicians updated',
            installationid,
            employeeIds,
            techniciannumbs: employeeIds.length,
        })
    } catch (err) {
        try {
            await client.query('ROLLBACK')
        } catch (rb) {
            console.error(rb)
        }
        console.error(err)
        return res.status(500).json({ error: 'Failed to update assignments', detail: err.message })
    } finally {
        client.release()
    }
}

export async function addInstallation(req, res) {
    const { siteid, scheduleddate, internalcost, price, techniciannumbs, description } = req.body
    const employeeIds = normalizeEmployeeIds(req.body)

    if (siteid == null || scheduleddate == null || String(scheduleddate).trim() === '') {
        return res.status(400).json({ message: 'siteid and scheduleddate are required' })
    }

    const ic = internalcost !== undefined && internalcost !== '' ? Number(internalcost) : 0
    const pr = price !== undefined && price !== '' ? Number(price) : 0
    const tn = techniciannumbs !== undefined && techniciannumbs !== '' ? parseInt(String(techniciannumbs), 10) : 1

    if (Number.isNaN(ic) || ic < 0 || Number.isNaN(pr) || pr < 0 || Number.isNaN(tn) || tn < 0) {
        return res.status(400).json({ message: 'internalcost, price, and techniciannumbs must be valid non-negative numbers' })
    }

    const effectiveTn = employeeIds.length > 0 ? employeeIds.length : tn

    const exists = await pool.query('SELECT 1 FROM public.location WHERE siteid = $1', [siteid])
    if (exists.rowCount === 0) {
        return res.status(400).json({ message: 'Invalid site (location) id' })
    }

    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        const result = await client.query(
            `INSERT INTO public.installation (
                siteid, scheduleddate, internalcost, price, techniciannumbs, description, status, completeddate
            ) VALUES ($1, $2::date, $3, $4, $5, $6, 'Scheduled', NULL)
            RETURNING *`,
            [siteid, scheduleddate, ic, pr, effectiveTn, description || null]
        )

        const row = result.rows[0]
        const iid = row.installationid

        if (employeeIds.length > 0) {
            const ok = await assertEmployeesExist(client, employeeIds)
            if (!ok) {
                await client.query('ROLLBACK')
                return res.status(400).json({ message: 'One or more employee ids are invalid' })
            }
            for (const eid of employeeIds) {
                await client.query(
                    'INSERT INTO public.assignment (employeeid, installationid, hoursworked) VALUES ($1, $2, 0)',
                    [eid, iid]
                )
            }
        }

        await client.query('COMMIT')

        res.status(201).json({
            message: 'Installation created',
            installation: row,
            assignedEmployeeIds: employeeIds,
        })
    } catch (err) {
        try {
            await client.query('ROLLBACK')
        } catch (rollbackErr) {
            console.error(rollbackErr)
        }
        console.error(err)
        res.status(500).json({
            error: 'Failed to create installation',
            detail: err.message,
        })
    } finally {
        client.release()
    }
}

