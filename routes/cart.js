import express from "express"
import { addToCart, getCart } from "../controller/cartController.js"



const cartRoutes= express.Router()

cartRoutes.post('/',addToCart )
cartRoutes.get('/:userId',getCart )




export default cartRoutes