import { Document, Types } from "mongoose";
export type TxType = "cashin" | "transfer";
export type FeeType = "credit" | "debit";
export interface ITransaction extends Document {
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
export declare const Transaction: import("mongoose").Model<ITransaction, {}, {}, {}, Document<unknown, {}, ITransaction, {}, {}> & ITransaction & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=transaction.model.d.ts.map