import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { timestamps: true });

// Prevent duplicate cart items for same user+product
cartItemSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to update cart item quantity
cartItemSchema.statics.updateCartItem = async function(userId, productId, quantity) {
  // Validate inputs
  if (!userId || !productId) {
    throw new Error('User ID and Product ID are required');
  }

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error('Invalid user or product ID format');
  }

  if (typeof quantity !== 'number' || quantity < 1) {
    throw new Error('Quantity must be a number and at least 1');
  }

  try {
    // Find and update the cart item
    const updatedItem = await this.findOneAndUpdate(
      {
        user: new mongoose.Types.ObjectId(userId),
        product: new mongoose.Types.ObjectId(productId)
      },
      { 
        quantity: quantity,
        updatedAt: Date.now()
      },
      { 
        new: true, // Return the updated document
        runValidators: true // Run schema validators
      }
    ).populate('product', 'name price images'); // Populate product details

    if (!updatedItem) {
      throw new Error('Cart item not found');
    }

    return updatedItem;
  } catch (error) {
    // Handle duplicate key error (though it shouldn't happen with findOneAndUpdate)
    if (error.code === 11000) {
      throw new Error('Cart item already exists for this user and product');
    }
    throw error;
  }
};

// Static method to remove from cart
cartItemSchema.statics.removeFromCart = async function(userId, productId) {
  if (!userId || !productId) {
    throw new Error('User ID and Product ID are required');
  }

  const result = await this.findOneAndDelete({
    user: new mongoose.Types.ObjectId(userId),
    product: new mongoose.Types.ObjectId(productId)
  });

  if (!result) {
    throw new Error('Cart item not found');
  }

  return {
    message: 'Item removed from cart successfully',
    deletedItem: result
  };
};

// Static method to get cart count
cartItemSchema.statics.getCartCount = async function(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const count = await this.countDocuments({
    user: new mongoose.Types.ObjectId(userId)
  });

  return count;
};

// Static method to check if item is in cart
cartItemSchema.statics.isInCart = async function(userId, productId) {
  if (!userId || !productId) {
    throw new Error('User ID and Product ID are required');
  }

  const item = await this.findOne({
    user: new mongoose.Types.ObjectId(userId),
    product: new mongoose.Types.ObjectId(productId)
  });

  return {
    inCart: !!item,
    quantity: item ? item.quantity : 0,
    item: item
  };
};

// Static method to clear cart
cartItemSchema.statics.clearCart = async function(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const result = await this.deleteMany({
    user: new mongoose.Types.ObjectId(userId)
  });

  return {
    message: `Cart cleared successfully. Removed ${result.deletedCount} items.`,
    deletedCount: result.deletedCount
  };
};

// Static method to get cart summary (total items, total price)
cartItemSchema.statics.getCartSummary = async function(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const items = await this.find({
    user: new mongoose.Types.ObjectId(userId)
  }).populate('product', 'name price');

  let totalItems = 0;
  let totalPrice = 0;
  const cartItems = [];

  items.forEach(item => {
    const itemTotal = item.quantity * (item.product?.price || 0);
    totalItems += item.quantity;
    totalPrice += itemTotal;

    cartItems.push({
      productId: item.product?._id,
      productName: item.product?.name,
      price: item.product?.price,
      quantity: item.quantity,
      itemTotal: itemTotal
    });
  });

  return {
    totalItems,
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    items: cartItems
  };
};

const CartItem = mongoose.model("CartItem", cartItemSchema);

export default CartItem;