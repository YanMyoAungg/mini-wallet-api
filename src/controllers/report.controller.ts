import type { Request, Response } from "express";
import {
  userReportService,
  transactionReportService,
} from "../services/report.service";

export async function userReport(req: Request, res: Response) {
  return userReportService(req, res);
}

export async function transactionReport(req: Request, res: Response) {
  return transactionReportService(req, res);
}
