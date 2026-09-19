export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Personal Finance Tracker API',
    version: '1.0.0',
    description: `A production-grade RESTful API for tracking personal income, expenses, categories, profile photos, monthly budget summaries, and administrative metrics.

### 🔐 Authentication
Most endpoints require a JWT Bearer token in the **Authorization** header:
\`Bearer <your_token>\`

### 🏷️ Features
* **Auth**: User registration, login, JWT token generation, role assignments (\`user\` / \`admin\`), profile management.
* **Transactions**: Full CRUD with search, category filtering, date filters, pagination, and monthly aggregated summaries.
* **Categories**: Predefined system categories and custom user categories.
* **Upload**: Cloudinary profile picture uploads with \`multer.memoryStorage()\`.
* **Admin**: Administrative analytics, user counts, transaction volumes, and top platform spending categories.
* **Security**: Helmet headers, CORS, Zod schema validation, Rate Limiting, and centralized error handling.
    `,
    contact: {
      name: 'API Support',
      email: 'support@financetracker.dev',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
    {
      url: 'https://personal-finance-tracker-api.onrender.com',
      description: 'Production Server (Render Deployment)',
    },
  ],
  tags: [
    { name: 'Auth', description: 'User registration, login, and profile operations' },
    { name: 'Transactions', description: 'Income and expense tracking, filters, and monthly summaries' },
    { name: 'Categories', description: 'Default system and user-created custom categories' },
    { name: 'Upload', description: 'Cloudinary media and profile picture uploads' },
    { name: 'Admin', description: 'Admin-only platform analytics and metrics' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer <token>',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6650b28489c43b924018f4a1' },
          name: { type: 'string', example: 'Alex Morgan' },
          email: { type: 'string', example: 'alex@example.com' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          profilePicture: { type: 'string', example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' },
          currency: { type: 'string', example: 'USD' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Alex Morgan' },
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          password: { type: 'string', format: 'password', minLength: 6, example: 'secretPass123!' },
          role: { type: 'string', enum: ['user', 'admin'], default: 'user', example: 'user' },
          currency: { type: 'string', example: 'USD' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'alex@example.com' },
          password: { type: 'string', format: 'password', example: 'secretPass123!' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6650b29989c43b924018f4a8' },
          user: { type: 'string', example: '6650b28489c43b924018f4a1' },
          title: { type: 'string', example: 'Groceries' },
          amount: { type: 'number', example: 50 },
          type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
          category: { type: 'string', example: 'Food' },
          date: { type: 'string', format: 'date', example: '2025-05-27' },
          notes: { type: 'string', example: 'Weekly supermarket shopping' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateTransactionRequest: {
        type: 'object',
        required: ['title', 'amount', 'type', 'category'],
        properties: {
          title: { type: 'string', example: 'Groceries' },
          amount: { type: 'number', example: 50 },
          type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
          category: { type: 'string', example: 'Food' },
          date: { type: 'string', format: 'date', example: '2025-05-27' },
          notes: { type: 'string', example: 'Organic veggies and fruits' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6650b29089c43b924018f4a5' },
          name: { type: 'string', example: 'Food & Dining' },
          type: { type: 'string', enum: ['income', 'expense', 'both'], example: 'expense' },
          icon: { type: 'string', example: '🍔' },
          color: { type: 'string', example: '#EF4444' },
          isDefault: { type: 'boolean', example: true },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description message' },
          errors: { type: 'array', items: { type: 'object' } },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a new user account with hashed password and returns JWT token and profile data.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User registered successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation Error or Email already exists',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'User Login',
        description: 'Authenticates user credentials and returns a JWT Bearer token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['Auth'],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Alex Updated' },
                  currency: { type: 'string', example: 'EUR' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/transactions': {
      post: {
        tags: ['Transactions'],
        summary: 'Add new income/expense transaction',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTransactionRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Transaction created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Transaction' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation Error' },
          401: { description: 'Unauthorized' },
        },
      },
      get: {
        tags: ['Transactions'],
        summary: 'List transactions with filters and pagination',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['income', 'expense'] }, description: 'Filter by income or expense' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category name' },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Start date (YYYY-MM-DD)' },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, description: 'End date (YYYY-MM-DD)' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term for title or notes' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: {
            description: 'Transactions list retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
                    pagination: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', example: 45 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        totalPages: { type: 'integer', example: 5 },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/transactions/monthly-summary': {
      get: {
        tags: ['Transactions'],
        summary: 'Get monthly summary & category breakdown',
        description: 'Returns total income, total expenses, net savings, savings rate, and category breakdowns for a specific month and year.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'year', in: 'query', schema: { type: 'integer', example: 2025 }, description: 'Year (default current year)' },
          { name: 'month', in: 'query', schema: { type: 'integer', example: 5 }, description: 'Month 1-12 (default current month)' },
        ],
        responses: {
          200: {
            description: 'Monthly summary aggregated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        period: { type: 'object' },
                        totals: {
                          type: 'object',
                          properties: {
                            income: { type: 'number', example: 3500 },
                            expense: { type: 'number', example: 1200 },
                            netSavings: { type: 'number', example: 2300 },
                            savingsRate: { type: 'string', example: '65.71%' },
                          },
                        },
                        categoryBreakdown: {
                          type: 'object',
                          properties: {
                            income: { type: 'array', items: { type: 'object' } },
                            expense: { type: 'array', items: { type: 'object' } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/transactions/{id}': {
      get: {
        tags: ['Transactions'],
        summary: 'Get a single transaction by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Transaction found' },
          404: { description: 'Transaction not found' },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['Transactions'],
        summary: 'Edit transaction',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTransactionRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Transaction updated successfully' },
          404: { description: 'Transaction not found' },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        tags: ['Transactions'],
        summary: 'Remove transaction',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Transaction deleted successfully' },
          404: { description: 'Transaction not found' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List predefined and user categories',
        parameters: [],
        responses: {
          200: {
            description: 'List of categories',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 12 },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create custom category',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Gym & Fitness' },
                  type: { type: 'string', enum: ['income', 'expense', 'both'], example: 'expense' },
                  icon: { type: 'string', example: '🏋️' },
                  color: { type: 'string', example: '#10B981' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Category created' },
          400: { description: 'Category already exists or invalid' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/upload/profile-picture': {
      post: {
        tags: ['Upload'],
        summary: 'Upload profile picture to Cloudinary',
        description: 'Uploads an image via `multer.memoryStorage()` directly to Cloudinary and updates user profile.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['profilePicture'],
                properties: {
                  profilePicture: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file (JPEG, PNG, WEBP, GIF, max 5MB)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile picture uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Profile picture uploaded successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        profilePicture: { type: 'string', example: 'https://res.cloudinary.com/.../image.jpg' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'No file or invalid file format' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/admin/overview': {
      get: {
        tags: ['Admin'],
        summary: 'Platform overview metrics (Admin only)',
        description: 'Returns total platform users, transaction volume, top spending categories across all users, and uptime metrics.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Overview data retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        summary: {
                          type: 'object',
                          properties: {
                            totalUsers: { type: 'integer', example: 120 },
                            totalTransactions: { type: 'integer', example: 1450 },
                            totalIncomeVolume: { type: 'number', example: 450000 },
                            totalExpenseVolume: { type: 'number', example: 320000 },
                            totalSystemVolume: { type: 'number', example: 770000 },
                          },
                        },
                        topExpenseCategories: { type: 'array', items: { type: 'object' } },
                        recentUsers: { type: 'array', items: { type: 'object' } },
                        serverTime: { type: 'string', format: 'date-time' },
                        uptime: { type: 'number', example: 3600 },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden (Requires Admin role)' },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all registered users (Admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of users' },
          403: { description: 'Forbidden' },
        },
      },
    },
  },
};
