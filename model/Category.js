// models/Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true 
    },
    // Array of 4 image URLs/Paths
    images: [{ 
      type: String,
      default: []
    }],
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    description: { // Optional: Add description field
      type: String,
      default: ''
    },
    isActive: { // Optional: To enable/disable categories
      type: Boolean,
      default: true
    },
    order: { // Optional: For sorting categories
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory',
  justOne: false
});

// Pre-save hook to ensure exactly 4 images (optional)
categorySchema.pre('save', function(next) {
  // If images array is provided, limit to first 4
  if (this.images && this.images.length > 4) {
    this.images = this.images.slice(0, 4);
  }
  next();
});

// Index for better performance
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;