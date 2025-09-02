import { Schema, model, Document, Types } from "mongoose";
const transactionSchema = new Schema({
    type: { type: String, enum: ["cashin", "transfer"], required: true },
    fromAccountType: { type: String, enum: ["company", "user"], required: true },
    fromCompanyId: { type: String, default: null },
    fromUserId: { type: Schema.Types.ObjectId, default: null },
    toAccountType: { type: String, enum: ["company", "user"], required: true },
    toCompanyId: { type: String, default: null },
    toUserId: { type: Schema.Types.ObjectId, default: null },
    amount: { type: Number, required: true },
    fee: { type: Number, required: true },
    feeType: { type: String, enum: ["credit", "debit"], required: true },
    companyDelta: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
    idempotencyKey: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
});
export const Transaction = model("Transaction", transactionSchema);
//# sourceMappingURL=transaction.model.js.map