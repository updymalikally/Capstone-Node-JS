import express from 'express';
import { getCategories, createCategory } from '../controllers/category.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const router = express.Router();

// Optional auth middleware so unauthenticated users can see default categories, while authenticated see both defaults + their custom
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_jwt_key_default');
      req.user = await User.findById(decoded.id);
    } catch (e) {
      // Ignore token error for optional auth
    }
  }
  next();
};

router.get('/', optionalAuth, getCategories);
router.post('/', protect, createCategory);

export default router;
