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
