import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",           // reference to users collection
    required: true,
  },
  reciever: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",        // reference to products collection
    required: true,
  
  },

}, { timestamps: true });

// Prevent duplicate cart items for same user+product
chatRoomSchema.index({ user: 1, reciver: 1 }, { unique: true });

const ChatRoom = mongoose.model("Chatroom", chatRoomSchema);

export default ChatRoom;