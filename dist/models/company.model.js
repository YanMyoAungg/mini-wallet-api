import { Schema, model, Document } from "mongoose";
const companySchema = new Schema({
    _id: { type: String, default: "company" },
    balance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});
export const Company = model("Company", companySchema);
//# sourceMappingURL=company.model.js.map