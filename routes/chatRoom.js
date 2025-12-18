import express from "express"
import { createChat } from "../controller/chatController.js"


const chatRoom= express.Router()

chatRoom.post('/create', createChat)


export default chatRoom