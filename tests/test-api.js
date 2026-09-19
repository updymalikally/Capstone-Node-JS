import 'dotenv/config';
import http from 'http';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { seedDefaultCategoriesIfEmpty } from '../src/controllers/category.controller.js';
import mongoose from 'mongoose';

const PORT = 5055;
let server;
let baseUrl = `http://localhost:${PORT}`;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = options.headers || {};
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }

  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log(`${colors.cyan}====================================================`);
  console.log(`🧪 Starting Personal Finance Tracker API Test Suite`);
  console.log(`====================================================${colors.reset}\n`);

  await connectDB();
  await seedDefaultCategoriesIfEmpty();

  server = app.listen(PORT);
  console.log(`Test server running at ${baseUrl}\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ${colors.green}✓ PASS:${colors.reset} ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ${colors.red}✗ FAIL:${colors.reset} ${name}`);
      console.error(`    ${colors.red}${err.message}${colors.reset}`);
      failed++;
    }
  }

  const testEmail = `test_${Date.now()}@example.com`;
  const adminEmail = `admin_${Date.now()}@example.com`;
  let userToken = '';
  let adminToken = '';
  let sampleTxId = '';

  try {
    // 1. Auth Tests
    await test('POST /auth/register - Register regular user', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: {
          name: 'Test User',
          email: testEmail,
          password: 'password123',
          role: 'user',
        },
      });
      if (res.status !== 201 || !res.data.data.token) {
        throw new Error(`Expected 201 with token, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      userToken = res.data.data.token;
    });

    await test('POST /auth/register - Register admin user', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: {
          name: 'Admin User',
          email: adminEmail,
          password: 'adminPassword123',
          role: 'admin',
        },
      });
      if (res.status !== 201 || !res.data.data.token) {
        throw new Error(`Expected 201 with token, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      adminToken = res.data.data.token;
    });

    await test('POST /auth/login - Login user with valid credentials', async () => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: {
          email: testEmail,
          password: 'password123',
        },
      });
      if (res.status !== 200 || !res.data.data.token) {
        throw new Error(`Expected 200 with token, got ${res.status}`);
      }
    });

    await test('GET /auth/profile - Fetch protected profile using Bearer token', async () => {
      const res = await request('/auth/profile', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200 || res.data.data.email !== testEmail) {
        throw new Error(`Expected 200 with email ${testEmail}, got ${res.status}`);
      }
    });

    // 2. Category Tests
    await test('GET /categories - Fetch predefined categories', async () => {
      const res = await request('/categories');
      if (res.status !== 200 || !Array.isArray(res.data.data) || res.data.data.length === 0) {
        throw new Error(`Expected 200 with non-empty categories array, got ${res.status}`);
      }
    });

    await test('POST /categories - Create custom category for user', async () => {
      const res = await request('/categories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          name: `Custom Tech Gadgets ${Date.now()}`,
          type: 'expense',
          icon: '💻',
          color: '#3B82F6',
        },
      });
      if (res.status !== 201 || !res.data.data._id) {
        throw new Error(`Expected 201 with created category, got ${res.status}`);
      }
    });

    // 3. Transactions Tests
    await test('POST /transactions - Add Expense transaction (Groceries, $50)', async () => {
      const res = await request('/transactions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          title: 'Groceries',
          amount: -50,
          type: 'expense',
          category: 'Food & Dining',
          date: '2025-05-27',
          notes: 'Weekly supermarket shopping',
        },
      });
      if (res.status !== 201 || !res.data.data._id) {
        throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      sampleTxId = res.data.data._id;
    });

    await test('POST /transactions - Add Income transaction (Salary, $3500)', async () => {
      const res = await request('/transactions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          title: 'Monthly Tech Salary',
          amount: 3500,
          type: 'income',
          category: 'Salary',
          date: '2025-05-01',
          notes: 'Direct deposit',
        },
      });
      if (res.status !== 201 || !res.data.data._id) {
        throw new Error(`Expected 201, got ${res.status}`);
      }
    });

    await test('GET /transactions - List all transactions with pagination', async () => {
      const res = await request('/transactions?limit=10', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.data) || res.data.data.length < 2) {
        throw new Error(`Expected 200 with at least 2 transactions, got ${res.status}`);
      }
    });

    await test('GET /transactions/monthly-summary - Aggregate monthly totals and breakdown', async () => {
      const res = await request('/transactions/monthly-summary?year=2025&month=5', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200 || !res.data.data.totals) {
        throw new Error(`Expected 200 with totals, got ${res.status}`);
      }
      const { totals } = res.data.data;
      if (totals.income !== 3500 || totals.expense !== 50 || totals.netSavings !== 3450) {
        throw new Error(`Totals calculation mismatch: ${JSON.stringify(totals)}`);
      }
    });

    await test('GET /transactions/:id - Retrieve specific transaction', async () => {
      const res = await request(`/transactions/${sampleTxId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200 || res.data.data.title !== 'Groceries') {
        throw new Error(`Expected 200 with title 'Groceries', got ${res.status}`);
      }
    });

    await test('PUT /transactions/:id - Update transaction amount', async () => {
      const res = await request(`/transactions/${sampleTxId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          amount: 65,
          notes: 'Updated groceries with snacks',
        },
      });
      if (res.status !== 200 || res.data.data.amount !== 65) {
        throw new Error(`Expected 200 with updated amount 65, got ${res.status}`);
      }
    });

    await test('DELETE /transactions/:id - Remove transaction', async () => {
      const res = await request(`/transactions/${sampleTxId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}`);
      }
    });

    // 4. Admin RBAC Tests
    await test('GET /admin/overview - Forbidden (403) for regular user', async () => {
      const res = await request('/admin/overview', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for normal user, got ${res.status}`);
      }
    });

    await test('GET /admin/overview - Allowed (200) for Admin user', async () => {
      const res = await request('/admin/overview', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !res.data.data.summary) {
        throw new Error(`Expected 200 with summary for admin, got ${res.status}`);
      }
    });

    // 5. Documentation & Health Tests
    await test('GET /docs - Swagger UI documentation endpoint is accessible', async () => {
      const res = await request('/docs/');
      if (res.status !== 200 && res.status !== 301) {
        throw new Error(`Expected Swagger docs status 200/301, got ${res.status}`);
      }
    });

    await test('GET /health - Health check endpoint returns online status', async () => {
      const res = await request('/health');
      if (res.status !== 200 || res.data.status !== 'online') {
        throw new Error(`Expected 200 online, got ${res.status}`);
      }
    });

  } finally {
    console.log(`\n====================================================`);
    console.log(`📊 Test Results: ${colors.green}${passed} Passed${colors.reset}, ${failed > 0 ? colors.red : colors.green}${failed} Failed${colors.reset}`);
    console.log(`====================================================\n`);

    if (server) {
      server.close();
    }
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
