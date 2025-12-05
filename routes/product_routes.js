import express from "express"
import { addProducts, filterProducts, getAllProducts, getProductById, getProductsByLevel } from "../controller/productsController.js"

const ALLproducts = express.Router()

ALLproducts.post('/', addProducts)
ALLproducts.get('/', getAllProducts)
ALLproducts.get('/all/:id', getProductById)
ALLproducts.get('/filter', filterProducts)
ALLproducts.get('/:level', getProductsByLevel)

export default ALLproducts