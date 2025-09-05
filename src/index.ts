import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./database/db.js";
import cashinRoutes from "./routes/cashIn.route";
import transferRoute from "./routes/transfer.route.js";
import {
  transactionReportRoute,
  userReportRoute,
} from "./routes/reports.route.js";

dotenv.config({ path: "../.env" });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB().catch((err) => {
  console.error("DB connect error:", err);
  process.exit(1);
});

app.use("/api/v1", cashinRoutes);

app.use("/api/v1", transferRoute);

app.use("/api/v1", userReportRoute);

app.use("/api/v1", transactionReportRoute);

const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`application is listening on ${port}`));
export default app;
