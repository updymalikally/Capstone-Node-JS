import express from 'express';
import {
  createTransaction,
  getTransactions,
  getMonthlySummary,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transaction.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionSchema,
  queryTransactionSchema,
} from '../validations/transaction.validation.js';

const router = express.Router();

// All transaction routes are protected by JWT
router.use(protect);

router.post('/', validate(createTransactionSchema), createTransaction);
router.get('/', validate(queryTransactionSchema), getTransactions);
router.get('/monthly-summary', getMonthlySummary);
router.get('/:id', validate(getTransactionSchema), getTransactionById);
router.put('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', validate(getTransactionSchema), deleteTransaction);

export default router;
