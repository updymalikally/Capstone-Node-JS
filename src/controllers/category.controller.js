import Category, { DEFAULT_CATEGORIES } from '../models/category.model.js';

/**
 * Helper to seed default categories if collection is empty
 */
export const seedDefaultCategoriesIfEmpty = async () => {
  try {
    const count = await Category.countDocuments({ isDefault: true });
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log('[Categories] Seeded default system categories.');
    }
  } catch (error) {
    console.warn('[Categories] Seeding check note:', error.message);
  }
};

/**
 * @desc    Get all available categories (default + user custom)
 * @route   GET /categories
 * @access  Public (Enhanced with user categories if authenticated)
 */
export const getCategories = async (req, res, next) => {
  try {
    // Make sure defaults exist
    await seedDefaultCategoriesIfEmpty();

    const query = {
      $or: [{ isDefault: true }],
    };

    if (req.user) {
      query.$or.push({ user: req.user._id });
    }

    const categories = await Category.find(query).sort({ isDefault: -1, name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a custom category for the user
 * @route   POST /categories
 * @access  Private (JWT)
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    // Check if category already exists for this user or as default
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      $or: [{ isDefault: true }, { user: req.user._id }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category '${name}' already exists`,
      });
    }

    const category = await Category.create({
      name: name.trim(),
      type: type || 'both',
      icon: icon || '🏷️',
      color: color || '#6366F1',
      isDefault: false,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};
