import Cart from "../model/Cart.js";


export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ message: "productId and quantity are required" });
    }

    const cart = new Cart({
      productId,
      quantity,
      userId: req.user?.id || null, // if needed
    });

    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ 
      message: "Failed to add to cart", 
      error: err.message 
    });
  }
};


export const getAllCarts = async (req, res) => {
  try {
    const cart = await Cart.find(); // fetch all products from DB
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
};