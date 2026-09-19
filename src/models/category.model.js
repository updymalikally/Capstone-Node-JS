import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'both'],
      default: 'both',
    },
    icon: {
      type: String,
      default: '🏷️',
    },
    color: {
      type: String,
      default: '#4F46E5',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system predefined categories
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per user (or per default category)
categorySchema.index({ name: 1, user: 1 }, { unique: true });

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#EF4444', isDefault: true },
  { name: 'Groceries', type: 'expense', icon: '🛒', color: '#F97316', isDefault: true },
  { name: 'Housing & Rent', type: 'expense', icon: '🏠', color: '#EAB308', isDefault: true },
  { name: 'Transportation', type: 'expense', icon: '🚗', color: '#84CC16', isDefault: true },
  { name: 'Utilities', type: 'expense', icon: '💡', color: '#10B981', isDefault: true },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#06B6D4', isDefault: true },
  { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#3B82F6', isDefault: true },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#6366F1', isDefault: true },
  { name: 'Salary', type: 'income', icon: '💵', color: '#22C55E', isDefault: true },
  { name: 'Freelance & Bonus', type: 'income', icon: '💼', color: '#14B8A6', isDefault: true },
  { name: 'Investments', type: 'income', icon: '📈', color: '#8B5CF6', isDefault: true },
  { name: 'Other', type: 'both', icon: '📦', color: '#6B7280', isDefault: true },
];

const Category = mongoose.model('Category', categorySchema);
export default Category;
