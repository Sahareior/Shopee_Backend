import mongoose from "mongoose";
import Message from "../model/Message.js";

/* ------------------------------------------------
   SEND MESSAGE
------------------------------------------------ */
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const {
      chatRoom,
      receiver,
      content,
      messageType = "text",
      attachments = [],
      repliedTo
    } = req.body;

    if (!chatRoom || !receiver || !content) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const message = await Message.create({
      chatRoom,
      sender: senderId,
      receiver,
      content,
      messageType,
      attachments,
      isReply: !!repliedTo,
      repliedTo
    });

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: message
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------
   GET MESSAGES BY CHAT ROOM (PAGINATION)
------------------------------------------------ */
export const getMessagesByRoom = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    console.log(chatRoomId,'asss')

    if (!mongoose.Types.ObjectId.isValid(chatRoomId)) {
      return res.status(400).json({ message: "Invalid chat room ID" });
    }

    const messages = await Message.find({
      chatRoom: chatRoomId,
      deletedFor: { $ne: req.user.id }
    })
      .populate("sender", "name avatar")
      .populate("receiver", "name avatar")
      .populate("repliedTo")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      page: Number(page),
      count: messages.length,
      data: messages.reverse()
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------
   MARK MESSAGE AS READ
------------------------------------------------ */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!message.readBy.some(r => r.user.toString() === userId)) {
      message.readBy.push({ user: userId });
    }

    message.status = "read";
    await message.save();

    res.status(200).json({
      success: true,
      message: "Message marked as read"
    });
  } catch (error) {
    console.error("Read Message Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------
   MARK ALL MESSAGES AS READ (CHAT ROOM)
------------------------------------------------ */
export const markChatAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatRoomId } = req.params;

    await Message.updateMany(
      {
        chatRoom: chatRoomId,
        receiver: userId,
        status: { $ne: "read" }
      },
      {
        $set: { status: "read" },
        $push: { readBy: { user: userId } }
      }
    );

    res.status(200).json({
      success: true,
      message: "All messages marked as read"
    });
  } catch (error) {
    console.error("Mark Chat Read Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------
   SOFT DELETE MESSAGE (FOR USER)
------------------------------------------------ */
export const deleteMessageForMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { deletedFor: userId } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Message deleted for you",
      data: message
    });
  } catch (error) {
    console.error("Delete Message Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------
   DELETE MESSAGE FOR EVERYONE
------------------------------------------------ */
export const deleteMessageForEveryone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      sender: userId
    });

    if (!message) {
      return res.status(403).json({ message: "Not authorized" });
    }

    message.isDeleted = true;
    message.content = "This message was deleted";
    message.attachments = [];
    await message.save();

    res.status(200).json({
      success: true,
      message: "Message deleted for everyone"
    });
  } catch (error) {
    console.error("Delete Everyone Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------------------------------
   UPDATE MESSAGE STATUS (DELIVERED)
------------------------------------------------ */
export const markAsDelivered = async (req, res) => {
  try {
    const { messageId } = req.params;

    await Message.findByIdAndUpdate(messageId, {
      status: "delivered"
    });

    res.status(200).json({
      success: true,
      message: "Message delivered"
    });
  } catch (error) {
    console.error("Delivered Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
