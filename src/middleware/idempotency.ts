import type { Request, Response, NextFunction } from "express";

export function requireIdempotencyKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.method === "POST") {
    const key = req.header("Idempotency-Key") || req.header("idempotency-key");
    if (!key)
      return res
        .status(400)
        .json({ error: "Idempotency-Key header is required" });
  }
  next();
}
