// import Category from '../models/Category.js';
import Category from "../model/Category.js";
import mongoose from 'mongoose';

// Create new category with 4 images
export const addCategory = async (req, res) => {
  try {
    const { name, slug, description, images = [], parentCategory, isActive = true, order = 0 } = req.body;

    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Category name and slug are required'
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }

    // Validate parent category if provided
    if (parentCategory && !mongoose.Types.ObjectId.isValid(parentCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent category ID'
      });
    }

    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    // Limit images to 4
    const limitedImages = Array.isArray(images) ? images.slice(0, 4) : [];

    // Create new category
    const category = new Category({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description?.trim() || '',
      images: limitedImages,
      parentCategory: parentCategory || null,
      isActive,
      order
    });

    await category.save();

    // Populate parent category info
    const populatedCategory = await Category.findById(category._id)
      .populate('parentCategory', 'name slug images');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: populatedCategory
    });

  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Get single category with subcategories
export const getCategory = async (req, res) => {
  try {
    const { slugOrId } = req.params;

    // Check if parameter is ObjectId or slug
    const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
    
    const query = isObjectId 
      ? { _id: slugOrId }
      : { slug: slugOrId };

    const category = await Category.findOne(query)
      .populate({
        path: 'subcategories',
        select: 'name slug images description isActive order',
        match: { isActive: true },
        options: { sort: { order: 1, name: 1 } }
      })
      .populate({
        path: 'parentCategory',
        select: 'name slug images'
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all categories with hierarchical structure
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .select('name slug images description parentCategory isActive order')
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Create hierarchical structure
    const categoryMap = {};
    const rootCategories = [];

    // First pass: create map
    categories.forEach(category => {
      category.subcategories = [];
      categoryMap[category._id] = category;
    });

    // Second pass: build tree
    categories.forEach(category => {
      if (category.parentCategory) {
        const parent = categoryMap[category.parentCategory.toString()];
        if (parent) {
          parent.subcategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    // Calculate counts
    const calculateCounts = (cat) => {
      cat.totalSubcategories = cat.subcategories.length;
      cat.subcategories.forEach(calculateCounts);
    };

    rootCategories.forEach(calculateCounts);

    res.json({
      success: true,
      data: rootCategories,
      count: categories.length
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all categories (flat list) - Updated version
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .select('name slug images description parentCategory isActive order createdAt')
      .populate('parentCategory', 'name slug')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch categories", 
      error: err.message 
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, images, parentCategory, isActive, order } = req.body;

    // Find category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if slug is being changed and already exists
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ slug, _id: { $ne: id } });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this slug already exists'
        });
      }
    }

    // Validate parent category (prevent circular reference)
    if (parentCategory && parentCategory === id) {
      return res.status(400).json({
        success: false,
        message: 'Category cannot be its own parent'
      });
    }

    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    // Limit images to 4
    const limitedImages = images ? images.slice(0, 4) : category.images;

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name: name || category.name,
        slug: slug || category.slug,
        images: limitedImages,
        description: description !== undefined ? description : category.description,
        parentCategory: parentCategory !== undefined ? parentCategory : category.parentCategory,
        isActive: isActive !== undefined ? isActive : category.isActive,
        order: order !== undefined ? order : category.order
      },
      {
        new: true,
        runValidators: true
      }
    )
    .populate('parentCategory', 'name slug images')
    .populate({
      path: 'subcategories',
      select: 'name slug images',
      match: { isActive: true }
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has subcategories
    const hasSubcategories = await Category.exists({ parentCategory: id });
    if (hasSubcategories) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Please delete subcategories first.'
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: deletedCategory
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get only parent categories
export const getParentCategories = async (req, res) => {
  try {
    const categories = await Category.find({ parentCategory: null, isActive: true })
      .select('name slug images description order')
      .sort({ order: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching parent categories:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get subcategories by parent
export const getSubcategories = async (req, res) => {
  try {
    const { parentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent category ID'
      });
    }

    const categories = await Category.find({ parentCategory: parentId, isActive: true })
      .select('name slug images description order')
      .sort({ order: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle category active status
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error) {
    console.error('Error toggling category status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update category order
export const updateCategoryOrder = async (req, res) => {
  try {
    const { orderUpdates } = req.body;

    if (!Array.isArray(orderUpdates)) {
      return res.status(400).json({
        success: false,
        message: 'orderUpdates must be an array'
      });
    }

    // Create bulk operations
    const bulkOps = orderUpdates.map(update => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { order: update.order } }
      }
    }));

    await Category.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: 'Category order updated successfully'
    });
  } catch (error) {
    console.error('Error updating category order:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};