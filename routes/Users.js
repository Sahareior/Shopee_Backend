import express from "express";
import { getUser } from "../controller/userController.js";


const user = express.Router();

// cart.post("/", getUser);
user.get("/", getUser);

export default user;
