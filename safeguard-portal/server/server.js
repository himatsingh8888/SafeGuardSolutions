import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/api.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


// Test route
app.get("/", (req, res) => {
  res.send("Safeguard backend running");
});

app.use("/api", apiRouter)



app.listen(5000, () => {
  console.log("Server running on port 5000");
});