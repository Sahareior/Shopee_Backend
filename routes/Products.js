import express from "express"
import { addProducts, getAllProducts } from "../controller/addProduct.js"

const products = express.Router()

products.post('/', addProducts)
products.get('/', getAllProducts)

export default products