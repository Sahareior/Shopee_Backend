import Cart from "../model/Cart.js";

export const addToCart = async (req, res) => {
  try {
    const { user, products } = req.body;

    // Validation
    if (!user) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Products array is required and cannot be empty" });
    }

    // Validate each product in the array
    for (const item of products) {
      if (!item.product || !item.quantity) {
        return res.status(400).json({ 
          message: "Each product must have productId and quantity" 
        });
      }
    }

    // Check if cart already exists for this user
    let cart = await Cart.findOne({ user });

    if (cart) {
      // Update existing cart - add or update products
      products.forEach(newProduct => {
        const existingProductIndex = cart.products.findIndex(
          p => p.product.toString() === newProduct.product
        );
        
        if (existingProductIndex > -1) {
          // Update quantity if product already exists
          cart.products[existingProductIndex].quantity += newProduct.quantity;
        } else {
          // Add new product to cart
          cart.products.push({
            product: newProduct.product,
            quantity: newProduct.quantity
          });
        }
      });
    } else {
      // Create new cart
      cart = new Cart({
        user,
        products
      });
    }

    await cart.save();

    // Populate the cart with product details
    const populatedCart = await Cart.findById(cart._id)
      .populate('products.product', 'name price images');

    res.status(200).json({
      message: "Cart updated successfully",
      cart: populatedCart
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Failed to add to cart", 
      error: err.message 
    });
  }
};

export const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find()
      .populate('user', 'name email')
      .populate('products.product', 'name price images');
    res.status(200).json(carts);
  } catch (err) {
    res.status(500).json({ 
      message: "Failed to fetch carts", 
      error: err.message 
    });
  }
};

// 🛒 GET CART BY USER ID
export const getCartByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ user: userId })
      .populate('user', 'name email')
      .populate('products.product', 'name price images discountPrice');

    if (!cart) {
      return res.status(200).json({
        message: "Cart is empty",
        cart: { products: [] }
      });
    }

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ 
      message: "Failed to fetch cart", 
      error: err.message 
    });
  }
};

// 🛒 REMOVE ITEM FROM CART
export const removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove the product from cart
    cart.products = cart.products.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();

    res.status(200).json({
      message: "Product removed from cart successfully",
      cart
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Failed to remove from cart", 
      error: err.message 
    });
  }
};