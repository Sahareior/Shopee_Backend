import mongoose from "mongoose";

const recentViewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  // Add createdAt field with default value
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  // This adds createdAt and updatedAt automatically
  timestamps: true 
});

// Create compound index to prevent duplicates
recentViewSchema.index({ user: 1, productId: 1 }, { unique: true });

const RecentView = mongoose.model("RecentView", recentViewSchema);

export default RecentView;