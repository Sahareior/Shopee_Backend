
import mongoose from "mongoose";
import CartItem from "../model/Cart.js";

/*
Assumption: req.user contains authenticated user's id (e.g. req.user._id)
Adjust according to your auth middleware.
*/

export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const items = await CartItem.find({ user: userId })
      .populate("product") // optionally populate product details
      .lean();
    return res.json({ success: true, items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    if (quantity <= 0) return res.status(400).json({ success: false, message: "Quantity must be >= 1" });

    // Upsert: if item exists, increment (or set) quantity; otherwise create
    const updated = await CartItem.findOneAndUpdate(
      { user: userId, product: productId },
      { $inc: { quantity }, $setOnInsert: { user: userId, product: productId } },
      { new: true, upsert: true, runValidators: true }
    ).populate("product");

    return res.status(200).json({ success: true, item: updated });
  } catch (err) {
    console.error(err);
    // handle unique index race-case
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Item already exists" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    if (quantity == null || quantity < 0) {
      return res.status(400).json({ success: false, message: "Quantity must be >= 0" });
    }

    if (quantity === 0) {
      // remove item
      await CartItem.findOneAndDelete({ user: userId, product: productId });
      return res.json({ success: true, message: "Item removed" });
    }

    const item = await CartItem.findOneAndUpdate(
      { user: userId, product: productId },
      { $set: { quantity } },
      { new: true, runValidators: true }
    ).populate("product");

    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    return res.json({ success: true, item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    await CartItem.findOneAndDelete({ user: userId, product: productId });
    return res.json({ success: true, message: "Removed from cart" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    await CartItem.deleteMany({ user: userId });
    return res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
