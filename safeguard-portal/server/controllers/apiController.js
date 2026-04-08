import pool from '../db/db.js'

export async function getClients(req, res){
        try {
            const result = await pool.query("SELECT * FROM Client");
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).send("Server error");
        }
        }

export async function getEmployees(req, res){
        try {
            const result = await pool.query("SELECT * FROM Employee");
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).send("Server error");
        }
        }

export async function getInstallations(req, res){
        try {
            const result = await pool.query("SELECT * FROM Installation");
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).send("Server error");
        }
        }

export async function getPayments(req, res){
        try {
            const result = await pool.query("SELECT * FROM Payment");
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).send("Server error");
        }
        }

export async function getInventory(req, res){
        try {
            const result = await pool.query("SELECT * FROM Inventory");
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).send("Server error");
        }
        }

export async function createQuoteRequest(req, res){
        const { name, email, phone, locationType, address, serviceType, notes } = req.body;

        try {
            const result = await pool.query(
                `INSERT INTO QuoteRequest (name, email, phone, locationType, address, serviceType, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [name, email, phone, locationType, address, serviceType, notes]
            );
            res.status(201).json({ message: "Quote request submitted successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to submit quote request" });
        }
        }

export async function getQuoteRequests(req, res){
        try {
            const result = await pool.query("SELECT * FROM QuoteRequest ORDER BY createdAt DESC");
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to fetch quote requests" });
        }
        }

export async function updateQuoteRequestStatus(req, res){
        const { id } = req.params;
        const { status } = req.body;

        console.log('Update status request:', { id, status });
        
        try {
            const result = await pool.query(
                `UPDATE quoterequest SET status = $1 WHERE requestid = $2`,
                [status, id]
            );
            console.log('Update result:', result.rowCount);
            
            if (result.rowCount === 0) {
                return res.status(404).json({ error: "Quote request not found" });
            }
            res.json({ message: "Status updated successfully" });
        } catch (err) {
            console.error('Update error:', err);
            res.status(500).json({ error: "Failed to update status" });
        }
        }
