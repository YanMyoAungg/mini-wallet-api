import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Company } from "../models/company.model";
import { User } from "../models/user.model";
import { Transaction } from "../models/transaction.model";

export async function cashInController(req: Request, res: Response) {
  const idempotencyKey = (req.header("Idempotency-Key") || "") as string;
  const { userId, amount } = req.body;

  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive integer" });
  }

  // Idempotency guard
  const existing = await Transaction.findOne({ idempotencyKey });
  if (existing) return res.status(200).json(existing);

  const company = await Company.findById("company");
  if (!company)
    return res.status(500).json({ error: "Company not initialized" });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  // compute fee rule (example: 0.1% for >=100001)
  let fee = 0;
  if (amount >= 100001) fee = Math.floor(amount * 0.001);
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

    const txn = await Transaction.create(
      [
        {
          type: "cashin",
          fromAccountType: "company",
          fromCompanyId: "company",
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
    return res.status(201).json(txn[0]);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json({ error: "TRANSACTION_FAILED", details: (err as Error).message });
  }
}
