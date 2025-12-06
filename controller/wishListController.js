import mongoose from "mongoose";
import WishList from "../model/WishList.js";



export const addWishList = async(req,res)=>{
    const data= req.body;
    try{
        const wishListData= await new WishList(data).save();
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

    const wishList = await WishList.aggregate(pipeline);
    return res.status(200).json({ success: true, data: wishList });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};