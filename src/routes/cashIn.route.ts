import { Router } from "express";
import { cashInController } from "../controllers/cashin.controller";
import { requireIdempotencyKey } from "../middleware/idempotency";

const router = Router();
router.post("/cash-in", requireIdempotencyKey, cashInController);

export default router;
