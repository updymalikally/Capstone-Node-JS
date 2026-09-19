import User from '../models/user.model.js';
import Transaction from '../models/transaction.model.js';

/**
 * @desc    Get admin platform overview (system metrics, top categories, user stats)
 * @route   GET /admin/overview
 * @access  Private (Admin only)
 */
export const getAdminOverview = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalTransactions,
      recentUsers,
      topExpenseCategories,
      financialAggregates,
    ] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt profilePicture'),
      Transaction.aggregate([
        { $match: { type: 'expense' } },
        {
          $group: {
            _id: '$category',
            totalSpent: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            category: '$_id',
            totalSpent: '$totalSpent',
            count: '$count',
          },
        },
      ]),
      Transaction.aggregate([
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    let totalIncomeVolume = 0;
    let totalExpenseVolume = 0;

    financialAggregates.forEach((agg) => {
      if (agg._id === 'income') totalIncomeVolume = agg.totalAmount;
      if (agg._id === 'expense') totalExpenseVolume = agg.totalAmount;
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalTransactions,
          totalIncomeVolume,
          totalExpenseVolume,
          totalSystemVolume: totalIncomeVolume + totalExpenseVolume,
        },
        topExpenseCategories,
        recentUsers,
        serverTime: new Date(),
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (Admin view)
 * @route   GET /admin/users
 * @access  Private (Admin only)
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
