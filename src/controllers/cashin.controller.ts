import express from "express";
import mongoose from "mongoose";
import { Company } from "../models/company.model";
import { User } from "../models/user.model";
import { Transfer } from "../models/transfer.model";
import { calculateTransferFee } from "../config/utils/fee";

export async function cashInController(
  req: express.Request,
  res: express.Response
) {
  const idempotencyKey = (req.header("Idempotency-Key") || "") as string;
  const { userId } = req.body;
  const amount = parseInt(req.body.amount, 10);

  if (!Number.isInteger(amount) || amount <= 0)
    return "amount must be a positive integer";

  // Idempotency guard
  const exist = await Transfer.findOne({ idempotencyKey });
  if (exist) return res.status(200).json(exist);
  console.log("output of req", req.body);

  const company = await Company.findById("AYA Bank");
  if (!company) {
    return res.status(500).json({ error: "Company not initialized" });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  console.log("still working");

  const fee = calculateTransferFee(amount);
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
