import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/api.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { clientRouter } from "./routes/clientRoute.js";
import { clientAuthRouter } from "./routes/clientAuth.js";
import { employeeRouter } from "./routes/employee.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Safeguard backend running");
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/client", clientRouter);
app.use("/api/client-auth", clientAuthRouter);
app.use("/api/employee", employeeRouter);
app.use("/api", apiRouter);

const PORT = Number(process.env.PORT) || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
