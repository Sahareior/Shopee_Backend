import express from "express";
import { addToCart, getAllCarts } from "../controller/CartController.js";

const cart = express.Router();

cart.post("/", addToCart);
cart.get("/", getAllCarts);

export default cart;
