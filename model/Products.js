// models/Product.js
import mongoose from 'mongoose';

const variationSchema = new mongoose.Schema({
  color: { type: String },
  size: { type: String },
  stock: { type: Number, default: 0 },
  sku: { type: String },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    images: [{ type: String }],
    brand: { type: String },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    variations: [variationSchema],
    labels: [
      {
        type: String,
        enum: ['top_product', 'new_item', 'flash_deal', 'just_for_you'],
      },
    ],
    discount: {
      type: Number,
    },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Pre-save middleware should be defined after schema creation
productSchema.pre('save', function (next) {
  // If product has flash_deal label AND discount is provided
  if (this.labels.includes('flash_deal') && this.discount) {
    const discountAmount = (this.price * this.discount) / 100;
    this.discountPrice = this.price - discountAmount;
  } else {
    // No flash deal → remove discount price
    this.discountPrice = undefined;
  }

  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;