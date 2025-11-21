import express from "express";
import { getUser, signIn, signUp } from "../controller/userController.js";


const user = express.Router();


user.post('/sign-up',signUp)

user.post("/sign-in", signIn)
// cart.post("/", getUser);
user.get("/", getUser);

export default user;
