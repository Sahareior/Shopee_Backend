import mongoose from "mongoose";

const filterOptionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  key: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["radio", "checkbox", "text", "number", "select", "boolean"], 
    required: true 
  },
  options: { type: [String], default: [] },
  required: { type: Boolean, default: false },
  searchable: { type: Boolean, default: false },
  placeholder: { type: String, default: "" },
  defaultValue: { type: String, default: "" },
});

// Create the subcategory schema with recursive nesting
const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, default: "" },
  filterOptions: { type: [filterOptionSchema], default: [] },
  subcategories: [{ type: mongoose.Schema.Types.Mixed, default: [] }] // prevent recursive schema corruption
}, { _id: true });


const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    image: { 
      data: Buffer, // Store image as binary data
      contentType: String // MIME type of the image
    },
    imagePreview: { type: String }, // Base64 or URL for preview
    subcategories: [subcategorySchema],
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true }
  }
);

// Virtual for total subcategories count (including nested)
categorySchema.virtual('totalSubcategories').get(function() {
  let count = 0;
  
  const countSubcategories = (subs) => {
    subs.forEach(sub => {
      count++;
      if (sub.subcategories && sub.subcategories.length > 0) {
        countSubcategories(sub.subcategories);
      }
    });
  };
  
  countSubcategories(this.subcategories);
  return count;
});

// Virtual for total filters count
categorySchema.virtual('totalFilters').get(function() {
  let count = 0;
  
  const countFilters = (subs) => {
    subs.forEach(sub => {
      count += sub.filterOptions.length;
      if (sub.subcategories && sub.subcategories.length > 0) {
        countFilters(sub.subcategories);
      }
    });
  };
  
  countFilters(this.subcategories);
  return count;
});

// Index for better performance on nested queries
categorySchema.index({ 'subcategories.slug': 1 });
categorySchema.index({ 'subcategories.subcategories.slug': 1 });

// Static method to find category by nested subcategory slug
categorySchema.statics.findBySubcategorySlug = function(slug) {
  return this.findOne({
    $or: [
      { 'subcategories.slug': slug },
      { 'subcategories.subcategories.slug': slug },
      { 'subcategories.subcategories.subcategories.slug': slug }
    ]
  });
};

// Instance method to get flattened subcategories
categorySchema.methods.getFlattenedSubcategories = function() {
  const flattened = [];
  
  const flatten = (subs, level = 0, parentPath = '') => {
    subs.forEach(sub => {
      const path = parentPath ? `${parentPath} > ${sub.name}` : sub.name;
      flattened.push({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        level: level,
        path: path,
        filterOptions: sub.filterOptions
      });
      
      if (sub.subcategories && sub.subcategories.length > 0) {
        flatten(sub.subcategories, level + 1, path);
      }
    });
  };
  
  flatten(this.subcategories);
  return flattened;
};

// Instance method to find subcategory by ID (including nested)
categorySchema.methods.findSubcategoryById = function(subcategoryId) {
  let foundSubcategory = null;
  
  const search = (subs) => {
    for (const sub of subs) {
      if (sub.id === subcategoryId) {
        foundSubcategory = sub;
        return true;
      }
      if (sub.subcategories && sub.subcategories.length > 0) {
        if (search(sub.subcategories)) return true;
      }
    }
    return false;
  };
  
  search(this.subcategories);
  return foundSubcategory;
};

// Middleware to ensure unique slugs within the same category
categorySchema.pre('save', function(next) {
  const slugSet = new Set();
  
  const checkSlugs = (subs, path = '') => {
    subs.forEach((sub, index) => {
      const currentPath = path ? `${path}.subcategories.${index}` : `subcategories.${index}`;
      const fullSlug = `${this.slug}-${sub.slug}`;
      
      if (slugSet.has(fullSlug)) {
        return next(new Error(`Duplicate slug found: ${sub.slug} at ${currentPath}`));
      }
      slugSet.add(fullSlug);
      
      if (sub.subcategories && sub.subcategories.length > 0) {
        checkSlugs(sub.subcategories, currentPath);
      }
    });
  };
  
  checkSlugs(this.subcategories);
  next();
});

export default mongoose.model("Category", categorySchema);