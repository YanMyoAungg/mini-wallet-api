import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Company } from "../models/company.model";
import { User } from "../models/user.model";
import { Transfer } from "../models/transfer.model";
import { calculateCashInFee } from "../config/utils/fee";

export async function cashInService(req: Request, res: Response) {
  const idempotencyKey = (req.header("Idempotency-Key") || "") as string;
  const { userId } = req.body;
  const amount = parseInt(req.body.amount, 10);

  if (!Number.isInteger(amount) || amount <= 0)
    return res.status(400).json({ error: "amount must be a positive integer" });

  // Idempotency Check
  const exist = await Transfer.findOne({ idempotencyKey });
  if (exist) return res.status(200).json(exist);

  const company = await Company.findById("AYA Bank");
  if (!company) {
    return res.status(500).json({ error: "Company not initialized" });
  }

  // Cash in to a single user, if user id is provided
  if (userId) {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const fee = calculateCashInFee(amount);
    const net = amount - fee;

    if (company.balance < amount)
      return res.status(400).json({ error: "INSUFFICIENT_COMPANY_FUNDS" });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      user.balance += net;
      await user.save({ session });

      company.balance = company.balance - amount + fee;
      await company.save({ session });

      const cashIn = await Transfer.create(
        [
          {
            type: "cashin",
            fromAccountType: "company",
            fromCompanyId: company._id,
            toAccountType: "user",
            toUserId: user._id,
            amount,
            fee,
            feeType: "credit",
            companyDelta: -amount + fee,
            status: "SUCCESS",
            idempotencyKey,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();
      return res.status(201).json({ cashIn });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(500)
        .json({ error: "TRANSACTION_FAILED", details: (err as Error).message });
    }
  }

  // Cash in to all users, if no user id is provided
  const users = await User.find();
  if (!users.length) return res.status(404).json({ error: "No users found" });

  const totalAmount = amount * users.length;
  if (company.balance < totalAmount)
    return res.status(400).json({ error: "INSUFFICIENT_COMPANY_FUNDS" });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const cashInResults = [];
    for (const user of users) {
      const fee = calculateCashInFee(amount);
      const net = amount - fee;
      user.balance += net;
      await user.save({ session });

      const transfer = await Transfer.create(
        [
          {
            type: "cashin",
            fromAccountType: "company",
            fromCompanyId: company._id,
            toAccountType: "user",
            toUserId: user._id,
            amount,
            fee,
            feeType: "credit",
            companyDelta: -amount + fee,
            status: "SUCCESS",
            idempotencyKey: `${idempotencyKey}:${user._id}`,
          },
        ],
        { session }
      );
      cashInResults.push(transfer[0]);
    }

    company.balance =
      company.balance -
      totalAmount +
      cashInResults.reduce((sum, t) => (t ? sum + t.fee : sum), 0);
    await company.save({ session });

    await session.commitTransaction();
    session.endSession();
    return res.status(201).json({ cashIn: cashInResults });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json({ error: "TRANSACTION_FAILED", details: (err as Error).message });
  }
}
