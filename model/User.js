import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows null for users who haven't set it
  },
  password: {
    type: String,
    required: true,
  },
  firstLogin: {
    type: Boolean,
    default: true,
  },
  
  // Profile Information
  bio: String,
  profilePicture: String,
  coverPhoto: String,
  website: String,
  location: String,
  
  // Social Media Stats
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followerCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  
  // E-commerce Related
  isSeller: {
    type: Boolean,
    default: false
  },
  sellerProfile: {
    storeName: String,
    storeDescription: String,
    rating: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    }
  },
  
  // Privacy Settings
  isPrivate: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", userSchema);
export default User;