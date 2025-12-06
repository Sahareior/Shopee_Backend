import express from "express"
import { addWishList, getWishList } from "../controller/wishListController.js"




const wishListRoutes= express.Router()

wishListRoutes.post('/',addWishList )
wishListRoutes.get('/:userId',getWishList )





export default wishListRoutes