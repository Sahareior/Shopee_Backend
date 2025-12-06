
import mongoose from "mongoose";
import CartItem from "../model/Cart.js";


  export const addToCart = async (req, res) => {
    try {
      const { user, product, quantity } = req.body;

     
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
    const { userId } = req.params;
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

//   async updateCartItem(req, res) {
//     try {
//       const { userId, productId } = req.params;
//       const { quantity } = req.body;

//       if (!userId || !productId) {
//         return res.status(400).json({
//           success: false,
//           message: "userId and productId are required"
//         });
//       }

//       const updatedItem = await CartItem.updateCartItem(
//         userId, 
//         productId, 
//         quantity
//       );

//       res.status(200).json({
//         success: true,
//         message: "Cart updated",
//         data: updatedItem
//       });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: error.message
//       });
//     }
//   }

//   async removeFromCart(req, res) {
//     try {
//       const { userId, productId } = req.params;

//       if (!userId || !productId) {
//         return res.status(400).json({
//           success: false,
//           message: "userId and productId are required"
//         });
//       }

//       const result = await CartItem.removeFromCart(userId, productId);

//       res.status(200).json({
//         success: true,
//         message: result.message
//       });
//     } catch (error) {
//       res.status(404).json({
//         success: false,
//         message: error.message
//       });
//     }
//   }

//   async clearCart(req, res) {
//     try {
//       const { userId } = req.params;

//       if (!userId) {
//         return res.status(400).json({
//           success: false,
//           message: "userId is required"
//         });
//       }

//       const result = await CartItem.clearCart(userId);

//       res.status(200).json({
//         success: true,
//         message: result.message,
//         deletedCount: result.deletedCount
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   }

//   async getCartCount(req, res) {
//     try {
//       const { userId } = req.params;

//       if (!userId) {
//         return res.status(400).json({
//           success: false,
//           message: "userId is required"
//         });
//       }

//       const count = await CartItem.getCartCount(userId);

//       res.status(200).json({
//         success: true,
//         count
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   }

//   async checkInCart(req, res) {
//     try {
//       const { userId, productId } = req.params;

//       if (!userId || !productId) {
//         return res.status(400).json({
//           success: false,
//           message: "userId and productId are required"
//         });
//       }

//       const status = await CartItem.isInCart(userId, productId);

//       res.status(200).json({
//         success: true,
//         ...status
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   }

//   async getCartSummary(req, res) {
//     try {
//       const { userId } = req.params;

//       if (!userId) {
//         return res.status(400).json({
//           success: false,
//           message: "userId is required"
//         });
//       }

//       const summary = await CartItem.getCartSummary(userId);

//       res.status(200).json({
//         success: true,
//         data: summary
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   }
