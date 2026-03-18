import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Test route
app.get("/", (req, res) => {
  res.send("Safeguard backend running");
});

// Query route
app.get("/clients", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Client");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});