import { Router } from "express";
import { requireIdempotencyKey } from "../middleware/idempotency";
import { transferController } from "../controllers/transfer.controller";

const router = Router();

// single or multiple transfers
const transferRoute = router.post(
  "/transfer",
  requireIdempotencyKey,
  transferController
);

export default transferRoute;
