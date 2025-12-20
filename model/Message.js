import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true,
    index: true // For faster queries
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'audio'],
    default: 'text'
  },
  // For file attachments
  attachments: [{
    url: String,
    fileName: String,
    fileType: String,
    fileSize: Number
  }],
  // Message status tracking
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],

  isReply: {
    type: Boolean,
    default: false
  },
  repliedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },

  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,

  indexes: [
    { chatRoom: 1, createdAt: -1 }, 
    { sender: 1, createdAt: -1 },   
    { receiver: 1, createdAt: -1 },
    { status: 1 }                   
  ]
});



const Message = mongoose.model("Message", messageSchema);

export default Message;