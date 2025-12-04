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

// Improved filterProducts - supports multi-value queries, variations SKUs, color/size arrays, inStock, rating, price ranges, labels, search, and category
export const filterProducts = async (req, res) => {
  console.log('Query parameters:', req.query);
  console.log('Full request:', req.url);

  try {
    // Destructure (all are strings or arrays from req.query)
    let {
      category,
      brand,
      minPrice,
      maxPrice,
      labels,
      rating,
      color,
      size,
      inStock,
      search,
      variations,    // interpreted as list of SKUs (comma-separated or multiple params)
      variationSku,  // alias for single/multi SKUs
      page,
      limit,
      sortBy
    } = req.query;

    // Helper: normalize query param into array of trimmed strings (or undefined)
    const normalizeToArray = (v) => {
      if (v === undefined || v === null) return undefined;
      if (Array.isArray(v)) return v.flatMap(x => String(x).split(',')).map(s => s.trim()).filter(Boolean);
      return String(v).split(',').map(s => s.trim()).filter(Boolean);
    };

    const brandArr = normalizeToArray(brand);
    const labelArr = normalizeToArray(labels);
    const colorArr = normalizeToArray(color);
    const sizeArr = normalizeToArray(size);
    const variationArr = normalizeToArray(variations || variationSku);

    // Build Mongo filter
    const filter = {};

    // Category (assume category is id or slug — if your data uses _id, pass that; if slug, adapt)
    if (category) {
      // If you're using Mongo ObjectId strings for category: pass as-is. If you want to match slug, change field.
      filter['categoryId._id'] = category; // adjust if you expect categoryId to be a plain id string or slug
    }

    // Brand: allow case-insensitive match for any provided brands
    if (brandArr && brandArr.length > 0) {
      filter.brand = { $in: brandArr.map(b => new RegExp(`^${escapeRegExp(b)}$`, 'i')) };
    }

    // Price range: supports numeric min/max; applies to "price" field (you can extend to discountPrice if desired)
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice !== undefined && minPrice !== '') filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') filter.price.$lte = Number(maxPrice);
    }

    // Labels: any-of
    if (labelArr && labelArr.length > 0) {
      filter.labels = { $in: labelArr };
    }

    // Rating (minimum)
    if (rating !== undefined && rating !== '') {
      const r = Number(rating);
      if (!Number.isNaN(r)) filter.rating = { $gte: r };
    }

    // Search across name and description
    if (search) {
      filter.$or = [
        { name: { $regex: escapeRegExp(search), $options: 'i' } },
        { description: { $regex: escapeRegExp(search), $options: 'i' } }
      ];
    }

    // Variations: build $elemMatch if any of color/size/sku/inStock filters exist
    const variationConditions = {};

    // color(s)
    if (colorArr && colorArr.length > 0) {
      variationConditions.color = { $in: colorArr.map(c => new RegExp(escapeRegExp(c), 'i')) };
    }

    // size(s)
    if (sizeArr && sizeArr.length > 0) {
      variationConditions.size = { $in: sizeArr.map(s => new RegExp(escapeRegExp(s), 'i')) };
    }

    // SKUs (variations param or variationSku)
    if (variationArr && variationArr.length > 0) {
      // exact-match on sku (case-sensitive or -insensitive depending on your data)
      variationConditions.sku = { $in: variationArr };
    }

    // inStock: if explicitly 'true' then require variation.stock > 0.
    // If you want "product-level" inStock (any variation >0), this $elemMatch works with other variation conditions.
    if (inStock !== undefined) {
      if (String(inStock).toLowerCase() === 'true') {
        variationConditions.stock = { $gt: 0 };
      } else if (String(inStock).toLowerCase() === 'false') {
        // If user asks for out-of-stock variations specifically:
        variationConditions.stock = { $lte: 0 };
      }
    }

    if (Object.keys(variationConditions).length > 0) {
      filter.variations = { $elemMatch: variationConditions };
    }

    console.log('Final filter object:', JSON.stringify(filter, null, 2));

    // Optional: pagination & sorting
    const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const perPage = limit ? Math.max(1, parseInt(limit, 10) || 20) : 50;
    const skip = (pageNum - 1) * perPage;

    // Build query
    let query = Products.find(filter);

    // Sorting (example: sortBy=price:asc or sortBy=rating:desc)
    if (sortBy) {
      const [field, dir] = String(sortBy).split(':');
      const sortOrder = dir && dir.toLowerCase() === 'desc' ? -1 : 1;
      query = query.sort({ [field]: sortOrder });
    }

    // Apply pagination
    query = query.skip(skip).limit(perPage);

    const products = await query.exec();

    console.log('Found products:', products.length);
    res.status(200).json(products);

  } catch (err) {
    console.error('Filter error:', err);
    res.status(500).json({
      message: "Failed to filter products",
      error: err.message
    });
  }
};

/**
 * Helper: escape a string for a RegExp (to avoid user-injected meta-characters)
 */
function escapeRegExp(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

