import express from "express";

import { deleteMessageForEveryone,  sendMessage,
  getMessagesByRoom,
  markAsRead,
  markChatAsRead,
  deleteMessageForMe,
  
  markAsDelivered } from "../controller/messageController.js";

const message = express.message();

message.post("/", sendMessage);
message.get("/:chatRoomId", getMessagesByRoom);
message.put("/read/:messageId", markAsRead);
message.put("/read-all/:chatRoomId", markChatAsRead);
message.put("/delivered/:messageId", markAsDelivered);
message.delete("/me/:messageId", deleteMessageForMe);
message.delete("/everyone/:messageId", deleteMessageForEveryone);

export default message;
