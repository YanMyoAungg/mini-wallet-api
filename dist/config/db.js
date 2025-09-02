import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export async function connectDB() {
    const uri = process.env.MONGO_URI ?? "mongodb://localhost:27017/wallet";
    await mongoose.connect(uri);
    console.log("MongoDB connected:", uri);
}
//# sourceMappingURL=db.js.map