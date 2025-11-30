const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    donor: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    amount: {
      type: String,
      required: true,
    },
    transactionHash: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("Donation", donationSchema);

