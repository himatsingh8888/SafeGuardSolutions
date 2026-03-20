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
