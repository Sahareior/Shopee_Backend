import express from "express"
import { allOrders, postOrders } from "../controller/OrderController.js"


const orders = express.Router()

orders.post('/', postOrders),
orders.get('/all-orders', allOrders); // use query param: ?userId=XXX



export default orders