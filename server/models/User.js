const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    userType: {
      type: String,
      enum: ["donor", "creator"],
      default: "donor",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    // Creator-specific fields
    creatorDetails: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      city: { type: String, trim: true },
      idProofNumber: { type: String, trim: true },
      bio: { type: String, trim: true },
      website: { type: String, trim: true },
      socialLinks: {
        twitter: { type: String, trim: true },
      },
      verificationInfo: {
        verified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        verificationMethod: { type: String },
      },
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("User", userSchema);

