
import Orders from './../model/Orders.js';


export const postOrders = async (req,res) => {
const data = req.body 

const orderData = await new Orders (data).save()
res.status(201).json({
      message: 'Order created successfully',
      orderData,
    });
console.log(data,'this data')

}

export const allOrders = async (req, res) => {
  try {
    // prefer query param first, then route param
    const userIdFromQuery = req.query.userId;
    const userIdFromParam = req.params.id;

    const userId = userIdFromQuery || userIdFromParam;

    let orders;
    if (!userId) {
      // no user id -> return all orders
      orders = await Orders.find({}).populate("productId")
        .populate("userInfo",{ password: 0 })
        .populate("category");
    } else {
      // return orders belonging to that user
      // adjust the field name if your Orders model uses a different key than `userId`
      orders = await Orders.find({ userId: userId });
    }

    return res.status(200).json(orders)
  } catch (err) {
    console.error('Get all orders error:', err);
    return res.status(500).json({ error: 'Something went wrong while fetching orders' });
  }
};