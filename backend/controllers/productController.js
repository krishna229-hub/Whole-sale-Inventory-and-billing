const Product = require('../models/Product');

// @desc    Get all products (with search and filter)
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, brand, lowStock } = req.query;
    let query = {};

    // Search filter (searches by product name or SKU)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Brand filter
    if (brand) {
      query.brand = brand;
    }

    // Low stock filter (quantity < 5)
    if (lowStock === 'true') {
      query.stockQuantity = { $lt: 5 };
    }

    const products = await Product.find(query).sort({ name: 1 });

    // Distinct categories for filters on frontend
    const categories = await Product.distinct('category');
    const brands = await Product.distinct('brand');

    res.status(200).json({
      success: true,
      count: products.length,
      categories,
      brands,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const { sku } = req.body;

    // Check duplicate SKU
    const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `Product with SKU ${sku.toUpperCase()} already exists`
      });
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check SKU duplication if SKU is changing
    if (req.body.sku && req.body.sku.toUpperCase() !== product.sku) {
      const existingSku = await Product.findOne({ sku: req.body.sku.toUpperCase() });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: `Product with SKU ${req.body.sku.toUpperCase()} already exists`
        });
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product removed'
    });
  } catch (error) {
    next(error);
  }
};
