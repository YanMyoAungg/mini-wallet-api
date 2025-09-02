import { Router } from "express";
import { cashInController } from "../controllers/cashin.controller";
import { requireIdempotencyKey } from "../middleware/idempotency";

const router = Router();

const cashInRoute = router.post(
  "/cash-in",
  requireIdempotencyKey,
  cashInController
);

export default cashInRoute;
