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


