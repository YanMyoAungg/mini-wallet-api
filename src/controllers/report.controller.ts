import type { Request, Response } from "express";
import mongoose, { type FilterQuery, Types } from "mongoose";
import { User } from "../models/user.model";
import { Transfer } from "../models/transfer.model";

export async function userReport(req: Request, res: Response) {
  try {
    const { phone } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(String(req.query.limit ?? "20"), 10))
    );
    const skip = (page - 1) * limit;

    if (phone) {
      const user = await User.findOne({ phone: String(phone) }).lean();
      if (!user)
        return res.status(404).json({ items: [], total: 0, page, limit });

      const uid = user._id;

      const inflowAgg = await Transfer.aggregate([
        { $match: { status: "SUCCESS", toUserId: uid } },
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
        { $match: { status: "SUCCESS", fromUserId: uid } },
        {
          $group: {
            _id: "$fromUserId",
            totalOutflow: { $sum: "$amount" },
            totalDebitFee: {
              $sum: {
                $cond: [{ $eq: ["$feeType", "debit"] }, "$fee", 0],
              },
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

      return res.json({ items: [item], page: 1, limit: 1, total: 1 });
    }

    // paginated list
    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);

    const userIds = users.map((u) => u._id);

    const inflowAgg = await Transfer.aggregate([
      { $match: { status: "SUCCESS", toUserId: { $in: userIds } } },
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
      { $match: { status: "SUCCESS", fromUserId: { $in: userIds } } },
      {
        $group: {
          _id: "$fromUserId",
          totalOutflow: { $sum: "$amount" },
          totalDebitFee: {
            $sum: {
              $cond: [{ $eq: ["$feeType", "debit"] }, "$fee", 0],
            },
          },
        },
      },
    ]);

    const inflowMap = new Map<string, any>();
    inflowAgg.forEach((d) => inflowMap.set(String(d._id), d));
    const outflowMap = new Map<string, any>();
    outflowAgg.forEach((d) => outflowMap.set(String(d._id), d)); // fixed lookup here

    const items = users.map((u) => {
      const id = String(u._id);
      const infl = inflowMap.get(id) ?? { totalInflow: 0, totalCreditFee: 0 };
      const outf = outflowMap.get(id) ?? { totalOutflow: 0, totalDebitFee: 0 };

      return {
        userId: id,
        name: u.name,
        phone: u.phone,
        balance: u.balance ?? 0,
        totalInflow: infl.totalInflow ?? 0,
        totalOutflow: outf.totalOutflow ?? 0,
        totalCreditFee: infl.totalCreditFee ?? 0,
        totalDebitFee: outf.totalDebitFee ?? 0,
      };
    });

    return res.json({ items, page, limit, total });
  } catch (err) {
    console.error("userReport error:", err);
    return res
      .status(500)
      .json({ error: "REPORT_ERROR", details: (err as Error).message });
  }
}

export async function transactionReport(req: Request, res: Response) {
  try {
    const { transactionId, status, type } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.max(
      1,
      Math.min(200, parseInt(String(req.query.limit ?? "20"), 10))
    );
    const skip = (page - 1) * limit;

    const q: FilterQuery<Transfer> = {};

    if (transactionId) {
      const tid = String(transactionId);
      try {
        // try ObjectId
        q._id = new Types.ObjectId(tid) as any;
      } catch {
        q.idempotencyKey = tid as any;
      }
    }

    if (status) q.status = String(status).toUpperCase() as any;
    if (type) q.type = String(type) as any;

    const [items, total] = await Promise.all([
      Transfer.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Transfer.countDocuments(q),
    ]);

    const out = (items as any[]).map((t) => ({
      transactionId: String(t._id),
      type: t.type,
      fromAccountType: t.fromAccountType ?? null,
      fromCompanyId: t.fromCompanyId ?? null,
      fromUserId: t.fromUserId ?? null,
      toAccountType: t.toAccountType ?? null,
      toCompanyId: t.toCompanyId ?? null,
      toUserId: t.toUserId ?? null,
      amount: t.amount ?? 0,
      fee: t.fee ?? 0,
      feeType: t.feeType ?? null,
      companyDelta: t.companyDelta ?? 0,
      status: t.status ?? null,
      idempotencyKey: t.idempotencyKey ?? null,
      createdAt: t.createdAt ?? null,
    }));

    return res.json({ items: out, page, limit, total });
  } catch (err) {
    console.error("transferReport error:", err);
    return res
      .status(500)
      .json({ error: "REPORT_ERROR", details: (err as Error).message });
  }
}
