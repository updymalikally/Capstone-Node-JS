import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(1, 'Title cannot be empty')
      .max(100, 'Title cannot exceed 100 characters'),
    amount: z
      .number({ required_error: 'Amount is required' })
      .refine((val) => val !== 0, { message: 'Amount cannot be zero' }),
    type: z.enum(['income', 'expense'], {
      required_error: 'Type is required and must be either income or expense',
    }),
    category: z
      .string({ required_error: 'Category is required' })
      .min(1, 'Category cannot be empty'),
    date: z
      .string()
      .or(z.date())
      .optional()
      .transform((val) => (val ? new Date(val) : new Date())),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().default(''),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID'),
  }),
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    amount: z.number().refine((val) => val !== 0, { message: 'Amount cannot be zero' }).optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().min(1).optional(),
    date: z
      .string()
      .or(z.date())
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    notes: z.string().max(500).optional(),
  }),
});

export const getTransactionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID'),
  }),
});

export const queryTransactionSchema = z.object({
  query: z.object({
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().regex(/^\d+$/).optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    sortBy: z.enum(['date', 'amount', 'title']).optional().default('date'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});
