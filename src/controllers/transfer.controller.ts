import type { Request, Response } from "express";
import { transferService } from "../services/transfer.service";

export async function transferController(req: Request, res: Response) {
  return transferService(req, res);
}
