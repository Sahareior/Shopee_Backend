import Category from "../model/Category.js";


// ➕ Add Category
export const addCategory = async (req, res) => {
    // console.log(req.body)
  try {
    const newCategory = new Category(req.body);
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ message: "Failed to add category", error: err.message });
  }
};

// 📋 Get All Categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories", error: err.message });
  }
};
