import Products from "../model/Products.js";



export const addProducts = async (req, res) => {
  console.log(req.body)
  try {
    const newProduct = new Products(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Products.find(); // fetch all products from DB
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
};
