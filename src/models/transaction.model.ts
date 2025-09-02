import { Schema, model, Document, Types } from "mongoose";

export type TxType = "cashin" | "transfer";
export type FeeType = "credit" | "debit";

export interface Transaction extends Document {
  type: TxType;
  fromAccountType: "company" | "user";
  fromCompanyId?: string | null;
  fromUserId?: Types.ObjectId | null;
  toAccountType: "company" | "user";
  toCompanyId?: string | null;
  toUserId?: Types.ObjectId | null;
  amount: number;
  fee: number;
  feeType: FeeType;
  companyDelta: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  idempotencyKey: string;
  createdAt: Date;
}

const transactionSchema = new Schema<Transaction>({
  type: { type: String, enum: ["cashin", "transfer"], required: true },
  fromAccountType: { type: String, enum: ["company", "user"], required: true },
  fromCompanyId: { type: String, default: null },
  fromUserId: { type: Schema.Types.ObjectId },
  toAccountType: { type: String, enum: ["company", "user"], required: true },
  toCompanyId: { type: String, default: null },
  toUserId: { type: Schema.Types.ObjectId },
  amount: { type: Number, required: true },
  fee: { type: Number, required: true },
  feeType: { type: String, enum: ["credit", "debit"], required: true },
  companyDelta: { type: Number, required: true },
  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING",
  },
  idempotencyKey: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export const Transaction = model<Transaction>("Transaction", transactionSchema);
