import express from "express"
import { addWishList, getWishList, removeFromWishList } from "../controller/wishListController.js"




const wishListRoutes= express.Router()

wishListRoutes.post('/',addWishList )
wishListRoutes.get('/',getWishList )
wishListRoutes.delete('/:itemId', removeFromWishList);





export default wishListRoutes