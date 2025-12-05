import mongoose from "mongoose";
import Products from "../model/Products.js";

export const addProducts = async (req, res) => {
  console.log(req.body);
  try {
    const newProduct = new Products(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Products.find().populate("categoryId"); // fetch all products from DB
    res.status(200).json(products);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: err.message });
  }
};

export const getProductsByLevel = async (req, res) => {
  const level = req.params.level;
  console.log(level);
  try {
    const products = await Products.find({ labels: level });
    res.status(200).json(products);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to fetch products by level",
        error: err.message,
      });
  }
};

export const filterProducts = async (req, res) => {
  try {
    const { categoryId } = req.query;
    console.log("Query parameters:", req.query);

    const pipeline = [];

  
    if (categoryId) {
      pipeline.push({
        $match: { categoryId },
      });
    }

    // No need for $lookup since category is already populated
    // But you might want to ensure consistent structure

    console.log("Aggregation pipeline:", JSON.stringify(pipeline, null, 2));

    const products = await Products.aggregate(pipeline);

    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (err) {
    console.error("Aggregation error:", err);
    res.status(500).json({
      message: "Failed to filter products",
      error: err.message,
    });
  }
};
