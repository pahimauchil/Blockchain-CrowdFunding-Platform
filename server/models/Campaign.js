const mongoose = require("mongoose");

const aiAnalysisSchema = new mongoose.Schema(
  {
    trustScore: { type: Number, default: 50 },
    riskFactors: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    analyzedAt: { type: Date, default: Date.now },
    sentiment: { type: String },
  },
  { _id: false }
);

const editHistorySchema = new mongoose.Schema(
  {
    editedBy: { type: String, required: true, lowercase: true, trim: true },
    editedAt: { type: Date, default: Date.now },
    changes: { type: Object, required: true }, // { field: { old: value, new: value } }
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: String, lowercase: true, trim: true },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { _id: true }
);

const campaignUpdateSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, default: "" }, // Optional image URL
    video: { type: String, default: "" }, // Optional video URL or embed link
    createdAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved", // Auto-approve updates (no admin approval required)
    },
    reviewedBy: { type: String, lowercase: true, trim: true },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { _id: true }
);

const campaignSchema = new mongoose.Schema(
  {
    onChainId: { type: Number, default: null },
    owner: { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    target: { type: Number, required: true },
    deadline: { type: Date, required: true },
    image: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    aiAnalysis: { type: aiAnalysisSchema, default: () => ({}) },
    rejectionReason: { type: String },
    editHistory: { type: [editHistorySchema], default: [] },
    updates: { type: [campaignUpdateSchema], default: [] },
    isDeployed: { type: Boolean, default: false },
    deployedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("Campaign", campaignSchema);

