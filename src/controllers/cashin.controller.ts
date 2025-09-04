import type { Request, Response } from "express";
import { cashInService } from "../services/cashin.service";

export async function cashInController(req: Request, res: Response) {
  return cashInService(req, res);
}
