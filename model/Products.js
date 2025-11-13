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
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
