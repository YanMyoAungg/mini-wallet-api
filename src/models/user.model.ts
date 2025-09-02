import { Schema, model, Document } from "mongoose";

export interface User extends Document {
  name: string;
  phone: string;
  balance: number;
  createdAt: Date;
}

const userSchema = new Schema<User>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const User = model<User>("User", userSchema);
