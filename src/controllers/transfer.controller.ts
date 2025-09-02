import type { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/user.model";
import { Company } from "../models/company.model";
import { Transfer } from "../models/transfer.model";
import { calculateTransferFee } from "../config/utils/fee";
import { validateTransferPayload } from "../config/utils/utility";

export async function transferController(req: Request, res: Response) {
  const idempotencyKeyHeader = (req.header("Idempotency-Key") ||
    req.header("idempotency-key") ||
    "") as string;

  if (!idempotencyKeyHeader)
    return res
      .status(400)
      .json({ error: "Idempotency-Key header is required" });

  // allow single object or array
  const payload = Array.isArray(req.body) ? req.body : [req.body];

  for (const item of payload) {
    const validate = validateTransferPayload(item as Transfer);

    if (validate) {
      return res.status(400).json({ error: validate });
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const company = await Company.findById("AYA Bank").session(session);
    if (!company)
      throw {
        code: "COMPANY_NOT_FOUND",
        message: "Company record missing",
      };

    const results = [];
    for (let i = 0; i < payload.length; i++) {
      const item: Transfer = payload[i];
      const idempotencyKey = `${idempotencyKeyHeader}:${i}`;

      const existing = await Transfer.findOne({ idempotencyKey }).session(
        session
      );
      if (existing) {
        results.push(existing);
        continue;
      }

      const fromUser = await User.findById(item.fromUserId).session(session);
      const toUser = await User.findById(item.toUserId).session(session);
      const amount = Number(item.amount);
      if (!Number.isInteger(amount) || amount <= 0)
        return "amount must be a positive integer";

      if (!fromUser)
        throw {
          code: "FROM_USER_NOT_FOUND",
          message: "fromUser not found",
          item,
        };
      if (!toUser)
        throw { code: "TO_USER_NOT_FOUND", message: "toUser not found", item };
      if (String(fromUser._id) === String(toUser._id)) {
        const txn = await Transfer.create(
          [
            {
              type: "transfer",
              fromAccountType: "user",
              fromUserId: fromUser._id,
              toAccountType: "user",
              toUserId: toUser._id,
              amount: amount,
              fee: 0,
              feeType: "debit",
              companyDelta: 0,
              status: "FAILED",
              idempotencyKey,
            },
          ],
          { session }
        );
        results.push({
          error: "SELF_TRANSFER_NOT_ALLOWED",
          transaction: txn[0],
        });
        continue;
      }

      const fee = calculateTransferFee(amount);
      const totalDebit = amount + fee; // sender pays amount + fee

      if (fromUser.balance < totalDebit) {
        // failed transaction record
        const txn = await Transfer.create(
          [
            {
              type: "transfer",
              fromAccountType: "user",
              fromUserId: fromUser._id,
              toAccountType: "user",
              toUserId: toUser._id,
              amount: Number(amount),
              fee,
              feeType: "debit",
              companyDelta: fee,
              status: "FAILED",
              idempotencyKey,
            },
          ],
          { session }
        );
        results.push({ error: "INSUFFICIENT_FUNDS", transaction: txn[0] });
        continue;
      }

      fromUser.balance -= totalDebit;
      toUser.balance += amount;
      company.balance += fee;

      await fromUser.save({ session });
      await toUser.save({ session });
      await company.save({ session });

      const txn = await Transfer.create(
        [
          {
            type: "transfer",
            fromAccountType: "user",
            fromUserId: fromUser._id,
            toAccountType: "user",
            toUserId: toUser._id,
            amount: amount,
            fee,
            feeType: "debit",
            companyDelta: fee,
            status: "SUCCESS",
            idempotencyKey,
          },
        ],
        { session }
      );

      results.push(txn[0]);
    }

    await session.commitTransaction();
    session.endSession();

    // single object
    if (!Array.isArray(req.body)) return res.status(201).json(results[0]);
    return res.status(201).json({ items: results });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();

    console.error("Transfer error:", err);
    return res
      .status(500)
      .json({ error: "TRANSACTION_FAILED", details: err?.message ?? err });
  }
}
