import mongoose from "mongoose";

const recentViewSchema = new mongoose.Schema({
 product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const RecentView = mongoose.model("RecentView", recentViewSchema);
export default RecentView;
