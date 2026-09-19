import mongoose from 'mongoose';
import Transaction from '../models/transaction.model.js';

/**
 * @desc    Create new transaction (income / expense)
 * @route   POST /transactions
 * @access  Private (JWT)
 */
export const createTransaction = async (req, res, next) => {
  try {
    const { title, amount, type, category, date, notes } = req.body;

    // Normalizing amount to absolute value while respecting type
    const normalizedAmount = Math.abs(amount);

    const transaction = await Transaction.create({
      user: req.user._id,
      title,
      amount: normalizedAmount,
      type,
      category,
      date: date || new Date(),
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all transactions with filtering, search & pagination
 * @route   GET /transactions
 * @access  Private (JWT)
 */
export const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = { user: req.user._id };

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = { $regex: new RegExp(category, 'i') };
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort(sort).skip(skip).limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly summary (totals, category breakdown, net savings)
 * @route   GET /transactions/monthly-summary
 * @access  Private (JWT)
 */
export const getMonthlySummary = async (req, res, next) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year || now.getFullYear(), 10);
    const month = parseInt(req.query.month || now.getMonth() + 1, 10); // 1-12

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const userObjectId = new mongoose.Types.ObjectId(req.user._id);

    // MongoDB Aggregation for Category Breakdown & Totals
    const summary = await Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: {
            category: '$category',
            type: '$type',
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id.category',
          type: '$_id.type',
          totalAmount: '$totalAmount',
          count: '$count',
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown = {
      income: [],
      expense: [],
    };

    summary.forEach((item) => {
      if (item.type === 'income') {
        totalIncome += item.totalAmount;
        categoryBreakdown.income.push({
          category: item.category,
          amount: item.totalAmount,
          count: item.count,
        });
      } else if (item.type === 'expense') {
        totalExpense += item.totalAmount;
        categoryBreakdown.expense.push({
          category: item.category,
          amount: item.totalAmount,
          count: item.count,
        });
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(2) + '%' : '0%';

    res.status(200).json({
      success: true,
      data: {
        period: {
          year,
          month,
          monthName: startOfMonth.toLocaleString('default', { month: 'long' }),
          startDate: startOfMonth,
          endDate: endOfMonth,
        },
        totals: {
          income: totalIncome,
          expense: totalExpense,
          netSavings,
          savingsRate,
        },
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single transaction by ID
 * @route   GET /transactions/:id
 * @access  Private (JWT)
 */
export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or you are not authorized to view it',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update transaction
 * @route   PUT /transactions/:id
 * @access  Private (JWT)
 */
export const updateTransaction = async (req, res, next) => {
  try {
    let transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or you are not authorized to edit it',
      });
    }

    const { title, amount, type, category, date, notes } = req.body;

    if (title !== undefined) transaction.title = title;
    if (amount !== undefined) transaction.amount = Math.abs(amount);
    if (type !== undefined) transaction.type = type;
    if (category !== undefined) transaction.category = category;
    if (date !== undefined) transaction.date = date;
    if (notes !== undefined) transaction.notes = notes;

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete transaction
 * @route   DELETE /transactions/:id
 * @access  Private (JWT)
 */
export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or you are not authorized to delete it',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};
