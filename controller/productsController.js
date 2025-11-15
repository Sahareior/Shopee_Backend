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

export const getProductsByLevel = async (req,res) => {
  const level = req.params.level;
  console.log(level);
  try {
    const products = await Products.find({ labels: level });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products by level", error: err.message });
  }
}

export const filterProducts = async (req, res) => {
  console.log('Query parameters:', req.query); 
  console.log('Full request:', req.url); 
  
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      labels,
      rating,
      color,
      size,
      inStock,
      search
    } = req.query; // Use req.query for GET requests

    console.log('Color:', color);
    console.log('Size:', size);

    // Build filter object
    const filter = {};

    // Category filter
    if (category) {
      filter.categoryId = category;
    }

    // Brand filter (case insensitive)
    if (brand) {
      filter.brand = { $regex: brand, $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Labels filter (array contains)
    if (labels) {
      const labelArray = Array.isArray(labels) ? labels : [labels];
      filter.labels = { $in: labelArray };
    }

    // Rating filter (minimum rating)
    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }

    // Search in name or description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Variations filters
    const variationConditions = {};
    
    if (color) {
      variationConditions.color = { 
        $regex: color, 
        $options: 'i' 
      };
    }
    
    if (size) {
      variationConditions.size = { 
        $regex: size, 
        $options: 'i' 
      };
    }
    
    if (inStock === 'true') {
      variationConditions.stock = { $gt: 0 };
    }

    // If we have variation filters, use $elemMatch
    if (Object.keys(variationConditions).length > 0) {
      filter.variations = { $elemMatch: variationConditions };
    }

    console.log('Final filter object:', JSON.stringify(filter, null, 2));
    
    const products = await Products.find(filter);
    
    console.log('Found products:', products.length);
    res.status(200).json(products);
    
  } catch (err) {
    console.error('Filter error:', err);
    res.status(500).json({ 
      message: "Failed to filter products", 
      error: err.message 
    });
  }
}
