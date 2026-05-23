import { connectDB, Giveaway, redis } from "../db";

async function clearDB() {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    console.log("🧹 Clearing MongoDB (Giveaways)...");
    await Giveaway.deleteMany({});
    console.log("✅ MongoDB cleared.");

    console.log("🧹 Clearing Redis (Upstash)...");
    await redis.flushdb();
    console.log("✅ Redis cleared.");

    console.log("🎉 All databases successfully cleared!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to clear databases:", err);
    process.exit(1);
  }
}

clearDB();
