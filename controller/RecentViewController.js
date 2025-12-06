import mongoose from "mongoose";
import RecentView from "../model/RecentView.js";

export const postRecentView = async (req, res) => {
  const data = req.body;

  try {
    // Option A: use Model.create (one-line)
    const savedData = await RecentView.create(data);

    // Option B (equivalent): const doc = new RecentView(data); const savedData = await doc.save();

    return res.status(201).json({
      message: "saved recent-view data",
      savedData,
    });
  } catch (err) {
    console.error("postRecentView error:", err);
    return res.status(500).json({ error: "Could not save recent view", details: err.message });
  }
};

export const getRecentView = async (req, res) => {
  try {
    const data = await RecentView.find()
      .populate("product")
      .populate("user",{password:0});

    return res.status(200).json(data);
  } catch (err) {
    console.error("getRecentView error:", err);
    return res.status(500).json({
      error: "Could not fetch recent views",
      details: err.message,
    });
  }
};

export const getRecentViewByUser = async (req, res) => {
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
            discountPrice: 1,
            images: 1
          }
        }
      }
    ];

    const recentViews = await RecentView.aggregate(pipeline);
    return res.status(200).json({ success: true, data: recentViews   });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


