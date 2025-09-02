import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
// import cashinRoutes from "./routes/cashin.routes";
dotenv.config();
const app = express();
app.use(express.json());
connectDB().catch((err) => {
    console.error("DB connect error:", err);
    process.exit(1);
});
console.log("MONGO_URI =", process.env.MONGO_URI);
// app.use("/api/v1/cash-in", cashinRoutes);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
//# sourceMappingURL=index.js.map