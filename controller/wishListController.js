import mongoose from "mongoose";
import WishList from "../model/WishList.js";



export const addWishList = async(req,res)=>{
    const {product}= req.body;
     const user = req.user.id;

    try{
        const wishListData= await new WishList({ user, product }).save();
        res.status(201).json({  
             success: true,
            message:'WishList added successfully',
            wishListData,
        });
    }catch(err){
        console.error('Error adding to wishlist:', err);
        res.status(500).json({ error: 'Could not add to wishlist', details: err.message });
    }   
};


export const getWishList = async (req, res) => {
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

    const wishList = await WishList.aggregate(pipeline);
    return res.status(200).json({ success: true, data: wishList });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWishList = async (req, res) => {
  try {
    const { itemId, productId } = req.params;
     const userId = req.user.id;

    let query = {};
    
    // Method 1: Remove by wishlist item ID
    if (itemId && mongoose.Types.ObjectId.isValid(itemId)) {
      query = { _id: itemId };
    }
    // Method 2: Remove by user and product ID
    else if (userId && productId && 
             mongoose.Types.ObjectId.isValid(userId) && 
             mongoose.Types.ObjectId.isValid(productId)) {
      query = { 
        user: userId, 
        product: productId 
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Valid itemId or userId+productId are required'
      });
    }

    const result = await WishList.findOneAndDelete(query);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Removed from wishlist successfully',
      data: result
    });

  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};