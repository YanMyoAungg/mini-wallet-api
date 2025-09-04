import type { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/user.model";
import { Transfer } from "../models/transfer.model";

export async function userReportService(req: Request, res: Response) {
  try {
    const { phone } = req.query;

    if (phone) {
      const user = await User.findOne({ phone: String(phone) }).lean();
      if (!user) return res.status(404).json({ items: [], total: 0 });

      const userId = user._id;

      const inflowAgg = await Transfer.aggregate([
        { $match: { status: "SUCCESS", toUserId: userId } },
        {
          $group: {
            _id: "$toUserId",
            totalInflow: { $sum: "$amount" },
            totalCreditFee: {
              $sum: {
                $cond: [{ $eq: ["$feeType", "credit"] }, "$fee", 0],
              },
            },
          },
        },
      ]);

      const outflowAgg = await Transfer.aggregate([
        { $match: { status: "SUCCESS", fromUserId: userId } },
        {
          $group: {
            _id: "$fromUserId",
            totalOutflow: { $sum: "$amount" },
            totalDebitFee: {
              $sum: { $cond: [{ $eq: ["$feeType", "debit"] }, "$fee", 0] },
            },
          },
        },
      ]);

      const inflow = inflowAgg[0] ?? { totalInflow: 0, totalCreditFee: 0 };
      const outflow = outflowAgg[0] ?? { totalOutflow: 0, totalDebitFee: 0 };

      const item = {
        userId: String(user._id),
        name: user.name,
        phone: user.phone,
        balance: user.balance ?? 0,
        totalInflow: inflow.totalInflow ?? 0,
        totalOutflow: outflow.totalOutflow ?? 0,
        totalCreditFee: inflow.totalCreditFee ?? 0,
        totalDebitFee: outflow.totalDebitFee ?? 0,
      };

      return res.json({ items: [item], total: 1 });
    }

    const users = await User.find().sort({ createdAt: -1 }).lean();

    const userIds = users.map((user) => user._id);

    const inflowAgg = await Transfer.aggregate([
      { $match: { status: "SUCCESS", toUserId: { $in: userIds } } },
      {
        $group: {
          _id: "$toUserId",
          totalInflow: { $sum: "$amount" },
          totalCreditFee: {
            $sum: { $cond: [{ $eq: ["$feeType", "credit"] }, "$fee", 0] },
          },
        },
      },
    ]);

    const outflowAgg = await Transfer.aggregate([
      { $match: { status: "SUCCESS", fromUserId: { $in: userIds } } },
      {
        $group: {
          _id: "$fromUserId",
          totalOutflow: { $sum: "$amount" },
          totalDebitFee: {
            $sum: { $cond: [{ $eq: ["$feeType", "debit"] }, "$fee", 0] },
          },
        },
      },
    ]);

    const inflowMap = new Map<string, any>();
    inflowAgg.forEach((data) => inflowMap.set(String(data._id), data));
    const outflowMap = new Map<string, any>();
    outflowAgg.forEach((data) => outflowMap.set(String(data._id), data));

    const items = users.map((user) => {
      const id = String(user._id);
      const infl = inflowMap.get(id) ?? { totalInflow: 0, totalCreditFee: 0 };
      const outf = outflowMap.get(id) ?? { totalOutflow: 0, totalDebitFee: 0 };

      return {
        userId: id,
        name: user.name,
        phone: user.phone,
        balance: user.balance ?? 0,
        totalInflow: infl.totalInflow ?? 0,
        totalOutflow: outf.totalOutflow ?? 0,
        totalCreditFee: infl.totalCreditFee ?? 0,
        totalDebitFee: outf.totalDebitFee ?? 0,
      };
    });

    return res.json({ items });
  } catch (err) {
    console.error("userReport error:", err);
    return res
      .status(500)
      .json({ error: "REPORT_ERROR", details: (err as Error).message });
  }
}

export async function transactionReportService(req: Request, res: Response) {
  try {
    const { transactionId, status, type } = req.query;

    const transaction: any = {};

    if (transactionId) {
      const id = String(transactionId);
      try {
        transaction._id = new Types.ObjectId(id);
      } catch {
        transaction.idempotencyKey = id;
      }
    }

    if (status) transaction.status = String(status).toUpperCase() as any;
    if (type) transaction.type = String(type) as any;

    const items = await Transfer.find(transaction)
      .sort({ createdAt: -1 })
      .lean();

    const records = (items as Transfer[]).map((item) => ({
      transactionId: String(item._id),
      type: item.type,
      fromAccountType: item.fromAccountType ?? null,
      fromCompanyId: item.fromCompanyId ?? null,
      fromUserId: item.fromUserId ?? null,
      toAccountType: item.toAccountType ?? null,
      toCompanyId: item.toCompanyId ?? null,
      toUserId: item.toUserId ?? null,
      amount: item.amount ?? 0,
      fee: item.fee ?? 0,
      feeType: item.feeType ?? null,
      companyDelta: item.companyDelta ?? 0,
      status: item.status ?? null,
      idempotencyKey: item.idempotencyKey ?? null,
      createdAt: item.createdAt ?? null,
    }));

    return res.json({ records });
  } catch (err) {
    console.error("transferReport error:", err);
    return res
      .status(500)
      .json({ error: "REPORT_ERROR", details: (err as Error).message });
  }
}
