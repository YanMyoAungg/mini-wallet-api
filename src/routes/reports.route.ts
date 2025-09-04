import { Router } from "express";
import {
  userReport,
  transactionReport,
} from "../controllers/report.controller";

const router = Router();

const userReportRoute = router.get("/report/users", userReport);
const transactionReportRoute = router.get(
  "/report/transactions",
  transactionReport
);

export { userReportRoute, transactionReportRoute };
