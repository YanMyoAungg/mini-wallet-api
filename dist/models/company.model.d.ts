import { Document } from "mongoose";
export interface ICompany extends Document {
    _id: string;
    balance: number;
    createdAt: Date;
}
export declare const Company: import("mongoose").Model<ICompany, {}, {}, {}, Document<unknown, {}, ICompany, {}, {}> & ICompany & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=company.model.d.ts.map