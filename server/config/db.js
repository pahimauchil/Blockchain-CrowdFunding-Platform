const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("[DB] Missing MONGODB_URI in environment variables");
    process.exit(1);
  }

  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(mongoUri);
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("[DB] MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

















