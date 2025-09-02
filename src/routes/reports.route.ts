import { Router } from "express";
import {
  userReport,
  transactionReport,
} from "../controllers/report.controller";

const router = Router();

router.get("/users", userReport);
router.get("/transactions", transactionReport);

export default router;
