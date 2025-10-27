// import Category from '../models/Category.js';

import Category from "../model/Category.js";

// Create new category with nested subcategories
export const addCategory = async (req, res) => {
  try {
    const { name, slug, description, subcategories, imagePreview } = req.body;

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

    // Process image if provided
    let imageData = null;
    if (req.file) {
      imageData = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    // Create new category
    const category = new Category({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description?.trim() || '',
      image: imageData,
      imagePreview: imagePreview,
      subcategories: processNestedSubcategories(subcategories)
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });

  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Helper function to process nested subcategories
const processNestedSubcategories = (subcategories, level = 0) => {
  if (!subcategories || !Array.isArray(subcategories)) return [];

  return subcategories.map(sub => ({
    id: sub.id || Date.now() + Math.random(),
    name: sub.name?.trim(),
    slug: sub.slug?.trim().toLowerCase(),
    description: sub.description?.trim() || '',
    filterOptions: processFilterOptions(sub.filterOptions),
    subcategories: processNestedSubcategories(sub.subcategories, level + 1)
  })).filter(sub => sub.name && sub.slug); // Remove invalid subcategories
};

// Helper function to process filter options
const processFilterOptions = (filterOptions) => {
  if (!filterOptions || !Array.isArray(filterOptions)) return [];

  return filterOptions.map(filter => ({
    id: filter.id || Date.now() + Math.random(),
    name: filter.name?.trim(),
    key: filter.key?.trim(),
    type: filter.type,
    options: Array.isArray(filter.options) 
      ? filter.options.filter(opt => opt?.trim()).map(opt => opt.trim()) 
      : [],
    required: Boolean(filter.required),
    searchable: Boolean(filter.searchable),
    placeholder: filter.placeholder?.trim() || '',
    defaultValue: filter.defaultValue?.trim() || ''
  })).filter(filter => filter.name && filter.key && filter.type); // Remove invalid filters
};

// Get category with nested subcategories
export const getCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug });
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

// Get all categories with basic info
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .select('name slug description imagePreview totalSubcategories totalFilters')
      .lean();

    // Calculate virtual fields manually since lean() doesn't include virtuals
    const categoriesWithCounts = categories.map(cat => ({
      ...cat,
      totalSubcategories: calculateTotalSubcategories(cat.subcategories),
      totalFilters: calculateTotalFilters(cat.subcategories)
    }));

    res.json({
      success: true,
      data: categoriesWithCounts,
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

// Helper functions for lean queries
const calculateTotalSubcategories = (subcategories) => {
  let count = 0;
  const countRecursive = (subs) => {
    subs.forEach(sub => {
      count++;
      if (sub.subcategories && sub.subcategories.length > 0) {
        countRecursive(sub.subcategories);
      }
    });
  };
  countRecursive(subcategories);
  return count;
};

const calculateTotalFilters = (subcategories) => {
  let count = 0;
  const countRecursive = (subs) => {
    subs.forEach(sub => {
      count += sub.filterOptions?.length || 0;
      if (sub.subcategories && sub.subcategories.length > 0) {
        countRecursive(sub.subcategories);
      }
    });
  };
  countRecursive(subcategories);
  return count;
};


export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories", error: err.message });
  }
};