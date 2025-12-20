import express from "express"
import { createChat } from "../controller/chatController.js"
import { getMessagesByRoom, sendMessage } from "../controller/messageController.js"


const chatRoom= express.Router()

chatRoom.post('/create', createChat)
chatRoom.post('/send-messages', sendMessage)
chatRoom.get('/all-messages/:chatRoomId', getMessagesByRoom)


export default chatRoom