import mongoose from "mongoose";


const OrderSchema = new mongoose.Schema({
    productId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    quantity: {
        type:Number,
        req: true
    },
    userInfo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    totalPrice: {
        type: Number,
        req: true
    }
})

const Orders = mongoose.model('Order', OrderSchema)

export default Orders
