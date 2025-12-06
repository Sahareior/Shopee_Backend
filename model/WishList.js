import mongoose from "mongoose";

const wishListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",           // reference to users collection
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",        // reference to products collection
    required: true,
  
  },

}, { timestamps: true });

// Prevent duplicate cart items for same user+product
wishListSchema.index({ user: 1, product: 1 }, { unique: true });

const WishList = mongoose.model("WishList", wishListSchema);

export default WishList;