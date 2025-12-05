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
    const products = await Products.find().populate('categoryId'); // fetch all products from DB
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
    } = req.query;

    console.log('Color:', color);
    console.log('Size:', size);

    // Build filter object
    const filter = {};

    // Helper function to handle array or single values
    const normalizeToArray = (value) => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    };

    // Category filter (supports multiple categories)
    if (category) {
      const categories = normalizeToArray(category);
      if (categories.length > 0) {
        filter.categoryId = categories.length === 1 ? categories[0] : { $in: categories };
      }
    }

    // Brand filter (supports multiple brands, case insensitive)
    if (brand) {
      const brands = normalizeToArray(brand);
      if (brands.length > 0) {
        if (brands.length === 1) {
          filter.brand = { $regex: brands[0], $options: 'i' };
        } else {
          filter.brand = { $in: brands.map(b => new RegExp(b, 'i')) };
        }
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Labels filter
    if (labels) {
      const labelArray = normalizeToArray(labels);
      if (labelArray.length > 0) {
        filter.labels = { $in: labelArray };
      }
    }

    // Rating filter
    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }

    // Search in name or description
    if (search) {
      const searchTerms = normalizeToArray(search);
      if (searchTerms.length > 0) {
        filter.$or = searchTerms.flatMap(term => [
          { name: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } }
        ]);
      }
    }

    // Variations filters
    const variationConditions = [];
    
    if (color) {
      const colors = normalizeToArray(color);
      if (colors.length > 0) {
        if (colors.length === 1) {
          variationConditions.push({
            color: { $regex: colors[0], $options: 'i' }
          });
        } else {
          variationConditions.push({
            color: { $in: colors.map(c => new RegExp(c, 'i')) }
          });
        }
      }
    }
    
    if (size) {
      const sizes = normalizeToArray(size);
      if (sizes.length > 0) {
        if (sizes.length === 1) {
          variationConditions.push({
            size: { $regex: sizes[0], $options: 'i' }
          });
        } else {
          variationConditions.push({
            size: { $in: sizes.map(s => new RegExp(s, 'i')) }
          });
        }
      }
    }
    
    if (inStock === 'true') {
      variationConditions.push({ stock: { $gt: 0 } });
    }

    // If we have variation filters
    if (variationConditions.length > 0) {
      if (variationConditions.length === 1) {
        filter.variations = { $elemMatch: variationConditions[0] };
      } else {
        filter.variations = { $elemMatch: { $and: variationConditions } };
      }
    }

    console.log('Final filter object:', JSON.stringify(filter, null, 2));
    
    // Find products with the filter
    const products = await Products.find(filter);
    
    // Extract metadata from the filtered products
    const colorsSet = new Set();
    const sizesSet = new Set();
    const brandsSet = new Set();
    
    products.forEach(product => {
      // Add brand to set
      if (product.brand) {
        brandsSet.add(product.brand);
      }
      
      // Add colors and sizes from variations
      if (product.variations && product.variations.length > 0) {
        product.variations.forEach(variation => {
          if (variation.color) {
            colorsSet.add(variation.color);
          }
          if (variation.size) {
            sizesSet.add(variation.size);
          }
        });
      }
    });
    
    // Convert sets to sorted arrays
    const colors = Array.from(colorsSet).sort();
    const sizes = Array.from(sizesSet).sort();
    const brands = Array.from(brandsSet).sort();
    
    console.log('Found products:', products.length);
    console.log('Metadata - Colors:', colors.length, 'Sizes:', sizes.length, 'Brands:', brands.length);
    
    // Return products along with metadata
    res.status(200).json({
      products,
      metadata: {
        colors,
        sizes,
        brands,
        totalProducts: products.length
      }
    });
    
  } catch (err) {
    console.error('Filter error:', err);
    res.status(500).json({ 
      message: "Failed to filter products", 
      error: err.message 
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate if id is provided
    if (!id) {
      return res.status(400).json({ 
        message: "Product ID is required" 
      });
    }

    // Find product by ID and populate category
    const product = await Products.findById(id).populate('categoryId');

    // Check if product exists
    if (!product) {
      return res.status(404).json({ 
        message: "Product not found" 
      });
    }

    // Log for debugging
    console.log(`Product found: ${product.name}`);

    // Return the product
    res.status(200).json(product);
    
  } catch (err) {
    console.error('Get product by ID error:', err);
    
    // Handle specific error types
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid product ID format" 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to fetch product", 
      error: err.message 
    });
  }
};