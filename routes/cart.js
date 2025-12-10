import express from "express"
import { addToCart, getCart, removeFromCart, updateCartItem,   } from "../controller/cartController.js"



const cartRoutes= express.Router()

cartRoutes.post('/',addToCart )
cartRoutes.get('/',getCart )
cartRoutes.put('/:itemId', updateCartItem);
cartRoutes.delete('/:itemId', removeFromCart);   

export default cartRoutes