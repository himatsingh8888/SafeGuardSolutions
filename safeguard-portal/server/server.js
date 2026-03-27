import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/api.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { clientRouter } from "./routes/clientRoute.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Safeguard backend running");
});

app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/client', clientRouter)
app.use("/api", apiRouter)

app.listen(5000, () => {
  console.log("Server running on port 5000");
});