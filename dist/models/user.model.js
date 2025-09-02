import { Schema, model, Document } from "mongoose";
const userSchema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});
export const User = model("User", userSchema);
//# sourceMappingURL=user.model.js.map