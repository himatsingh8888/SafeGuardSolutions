import bcrypt from "bcrypt";
import pool from "./db/db.js";



const username = "client_test4";
const password = "yourpasswordhere";

// Login user (users table)
const userDisplayName = "Test Client";
const userEmail = "client_test4@safeguard.com";

// Client profile (client table) — shown on Client Dashboard
const fname = "Test";
const lname = "ClientUser";
const billingaddress = "123 Test Street, Vancouver, BC";
const customertype = "Residential"; // or 'Commercial'
const clientEmail = "client_test4@safeguard.com";
const phone = "6045550100";

const hashedPassword = await bcrypt.hash(password, 10);

try {
  const clientResult = await pool.query(
    `INSERT INTO public.client (fname, lname, billingaddress, customertype, email, phone)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING clientid`,
    [fname, lname, billingaddress, customertype, clientEmail, phone]
  );
  const clientid = clientResult.rows[0].clientid;

  await pool.query(
    "INSERT INTO public.users (name, email, username, password, role) VALUES ($1, $2, $3, $4, $5)",
    [userDisplayName, userEmail, username, hashedPassword, "client"]
  );

  console.log("Client profile + login user created successfully.");
  console.log(`  username (login): ${username}`);
  console.log(`  clientid (dashboard API): ${clientid}`);
  console.log("");
  console.log("Add this to client/.env and restart Vite:");
  console.log(`  VITE_DEV_CLIENT_ID=${clientid}`);
} catch (err) {
  if (err?.code === "23505") {
    console.error(
      "Insert failed: username or email already exists (or unique conflict on client).",
      "\nIf you already ran this script, either delete the old rows from public.users / public.client",
      "\nor change username/email in this file."
    );
  } else {
    console.error(err);
  }
  process.exitCode = 1;
}

process.exit();
