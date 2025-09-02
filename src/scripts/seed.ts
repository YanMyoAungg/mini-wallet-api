import { connectDB } from "../database/db.ts";
import { Company } from "../models/company.model.ts";
import { User } from "../models/user.model.ts";

async function seed() {
  await connectDB();

  await Company.findByIdAndUpdate(
    "AYA Bank",
    { balance: 10000000, createdAt: new Date() },
    { upsert: true, new: true }
  );

  const users = [
    { name: "Aung Aung", phone: "091111111" },
    { name: "Mg Mg", phone: "092222222" },
    { name: "Su Su", phone: "093333333" },
    { name: "Thiri", phone: "094444444" },
    { name: "Zaw Zaw", phone: "095555555" },
  ];

  for (const user of users) {
    await User.updateOne(
      { phone: user.phone },
      { $setOnInsert: { ...user, balance: 0, createdAt: new Date() } },
      { upsert: true }
    );
  }

  console.log("Seed completed");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
