import express from "express"
import { addProducts, filterProducts, getAllProducts, getProductsByLevel } from "../controller/productsController.js"

const products = express.Router()

products.post('/', addProducts)
products.get('/', getAllProducts)
products.get('/filter', filterProducts)
products.get('/:level', getProductsByLevel)

export default products