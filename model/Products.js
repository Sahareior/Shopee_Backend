// models/Product.js
const mongoose = require('mongoose');

const specificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  values: [String] // Array of selected values
});

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  stock: Number,

  // Category references
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  subcategory: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  nestedSubcategory: { 
     type: mongoose.Schema.Types.Mixed, 
    ref: 'Category'
  },

  // Category hierarchy
  categoryPath: { type: [mongoose.Schema.Types.Mixed], default: [] },
  finalCategorySlug: String,

  // Simplified specifications
  specification: [specificationSchema],

  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);