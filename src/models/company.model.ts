import { Schema, model, Document } from "mongoose";

export interface Company extends Document {
  _id: string; // 'company'
  balance: number;
  createdAt: Date;
}

const companySchema = new Schema<Company>({
  _id: { type: String, default: "AYA Bank" },
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const Company = model<Company>("Company", companySchema);
