import mongoose from "mongoose";
import CartItem from "../model/Cart.js";


  export const addToCart = async (req, res) => {
    try {
      const {  product, quantity } = req.body;
       const user = req.user.id;
     
      // Validate required fields
      if (!user || !product) {
        return res.status(400).json({
          success: false,
          message: "userId and productId are required"
        });
      }

      const cartItem = await CartItem.create({ user, product, quantity: quantity || 1 });

      res.status(200).json({
        success: true,
        message: "Item added to cart",
        data: cartItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(400).json({ success: false, message: "userId is required" });

    const pipeline = [
      { $match: { user: new mongoose.Types.ObjectId(userId) } },

      // join with products collection
      {
        $lookup: {
          from: "products",        // Mongo collection name
          localField: "product",   // field in CartItem
          foreignField: "_id",     // field in Product
          as: "product"
        }
      },

      // product will be an array; unwind to get single object (preserve nulls if product missing)
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },

      // optional: project fields you want
      {
        $project: {
          user: 1,
          quantity: 1,
          createdAt: 1,
          updatedAt: 1,
          product: {
            _id: 1,
            name: 1,
            price: 1,
            images: 1
          }
        }
      }
    ];

    const cart = await CartItem.aggregate(pipeline);
    return res.status(200).json({ success: true, data: cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    console.log(itemId);

    // Validate required fields
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Valid itemId is required"
      });
    }

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: "Quantity is required"
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1"
      });
    }

    // Find and update the cart item
    const updatedItem = await CartItem.findByIdAndUpdate(
      itemId,
      { quantity },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: updatedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Validate itemId
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Valid itemId is required"
      });
    }

    // Find and delete the cart item
    const deletedItem = await CartItem.findByIdAndDelete(itemId);

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      data: deletedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}