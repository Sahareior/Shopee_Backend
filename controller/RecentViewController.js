import mongoose from "mongoose";
import RecentView from "../model/RecentView.js";

export const postRecentView = async (req, res) => {
  try {
    const user = req.user.id;
    const { productId } = req.body;

    if (!productId) return res.status(400).json({ error: "productId id is required" });

    // Validate productId is ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "invalid productId id" });
    }

    // Check for existing recent view for the same user and product
    const existingView = await RecentView.findOne({ user, productId });

    if (existingView) {
      // Update the timestamp of the existing view to make it recent
      existingView.createdAt = new Date();
      await existingView.save();
      
      return res.status(200).json({
        message: "Recent view updated",
        savedData: existingView,
      });
    }

    // Create new recent view if it doesn't exist
    const savedData = await RecentView.create({ user, productId });

    // Clean up old views (older than 7 days) for this user
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await RecentView.deleteMany({ 
      user, 
      createdAt: { $lt: sevenDaysAgo } 
    });

    return res.status(201).json({
      message: "Saved recent-view data",
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
      .populate("productId");

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
    const userId = req.user.id;

    // Clean up old views (older than 7 days) for this user before fetching
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await RecentView.deleteMany({ 
      user: userId, 
      createdAt: { $lt: sevenDaysAgo } 
    });

    // Fetch recent views (last 7 days, limited to 20)
    const recentViews = await RecentView.find({ user: userId })
      .sort({ createdAt: -1 }) // Sort by creation date
      .limit(20)
      .populate({
        path: "productId",
        select: "name price images slug",
      })
      .lean();

    return res.status(200).json({ success: true, data: recentViews });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Optional: Add a scheduled cleanup function to run periodically
// This can be called via a cron job or setInterval
export const cleanupOldRecentViews = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const result = await RecentView.deleteMany({ 
      createdAt: { $lt: sevenDaysAgo } 
    });
    
    console.log(`Cleaned up ${result.deletedCount} old recent views`);
    return result;
  } catch (error) {
    console.error("Cleanup error:", error);
    throw error;
  }
};