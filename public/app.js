// State
let token = localStorage.getItem('finance_jwt_token') || null;
let currentUser = null;
let chartInstance = null;

// DOM Elements
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const authNavButtons = document.getElementById('authNavButtons');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const addTransactionForm = document.getElementById('addTransactionForm');
const transactionTableBody = document.getElementById('transactionTableBody');
const txCategorySelect = document.getElementById('txCategory');
const avatarUploadInput = document.getElementById('avatarUploadInput');
const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');
const closeAdminModal = document.getElementById('closeAdminModal');
const searchTxInput = document.getElementById('searchTxInput');
const filterType = document.getElementById('filterType');
const refreshTxBtn = document.getElementById('refreshTxBtn');

// Init
document.addEventListener('DOMContentLoaded', async () => {
  // Set default transaction date to today
  document.getElementById('txDate').value = new Date().toISOString().split('T')[0];

  await loadCategories();

  if (token) {
    await fetchProfile();
  } else {
    showAuthUI();
  }
});

// UI View Toggle
function showAuthUI() {
  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  authNavButtons.innerHTML = `<span class="text-xs text-slate-400">Not Logged In</span>`;
}

function showDashboardUI() {
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  authNavButtons.innerHTML = `
    <span class="text-xs text-emerald-400 font-medium">Logged in: ${currentUser.name}</span>
  `;
}

// Categories loader
async function loadCategories() {
  try {
    const res = await fetch('/categories');
    const json = await res.json();
    if (json.success && json.data) {
      txCategorySelect.innerHTML = json.data
        .map((cat) => `<option value="${cat.name}">${cat.icon || '🏷️'} ${cat.name}</option>`)
        .join('');
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
}

// Auth Handlers
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;
  const currency = document.getElementById('regCurrency').value;

  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, currency }),
    });

    const json = await res.json();
    if (json.success) {
      token = json.data.token;
      localStorage.setItem('finance_jwt_token', token);
      currentUser = json.data.user;
      showDashboardUI();
      await refreshAllData();
      alert('Account registered successfully!');
    } else {
      alert(`Registration failed: ${json.message || JSON.stringify(json.errors)}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (json.success) {
      token = json.data.token;
      localStorage.setItem('finance_jwt_token', token);
      currentUser = json.data.user;
      showDashboardUI();
      await refreshAllData();
    } else {
      alert(`Login failed: ${json.message}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
});

// Fetch Profile
async function fetchProfile() {
  try {
    const res = await fetch('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    if (json.success && json.data) {
      currentUser = json.data;
      document.getElementById('userName').textContent = currentUser.name;
      document.getElementById('userEmail').textContent = currentUser.email;
      document.getElementById('userRoleBadge').textContent = currentUser.role;
      if (currentUser.profilePicture) {
        document.getElementById('userAvatar').src = currentUser.profilePicture;
      }

      if (currentUser.role === 'admin') {
        adminBtn.classList.remove('hidden');
      } else {
        adminBtn.classList.add('hidden');
      }

      showDashboardUI();
      await refreshAllData();
    } else {
      logout();
    }
  } catch (err) {
    logout();
  }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', logout);
function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('finance_jwt_token');
  showAuthUI();
}

// Refresh Data (Transactions + Summary)
async function refreshAllData() {
  await Promise.all([loadTransactions(), loadMonthlySummary()]);
}

// Load Monthly Summary
async function loadMonthlySummary() {
  try {
    const res = await fetch('/transactions/monthly-summary', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.success && json.data) {
      const { totals, categoryBreakdown, period } = json.data;
      document.getElementById('statIncome').textContent = `$${totals.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      document.getElementById('statExpense').textContent = `$${totals.expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      document.getElementById('statNetSavings').textContent = `$${totals.netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      document.getElementById('statSavingsRate').textContent = totals.savingsRate;
      document.getElementById('chartMonthLabel').textContent = `${period.monthName} ${period.year}`;

      renderChart(categoryBreakdown.expense);
    }
  } catch (err) {
    console.error('Error fetching monthly summary:', err);
  }
}

// Render Doughnut Chart
function renderChart(expenseCategories) {
  const ctx = document.getElementById('categoryChart').getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = expenseCategories.map((c) => c.category);
  const data = expenseCategories.map((c) => c.amount);

  if (labels.length === 0) {
    labels.push('No Expenses');
    data.push(1);
  }

  const backgroundColors = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
  ];

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#1E293B',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#CBD5E1', font: { size: 11 } },
        },
      },
    },
  });
}

// Load Transactions
async function loadTransactions() {
  try {
    let url = '/transactions?limit=20';
    const search = searchTxInput.value.trim();
    const type = filterType.value;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();

    if (json.success && json.data) {
      if (json.data.length === 0) {
        transactionTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="px-4 py-8 text-center text-slate-400">
              No transactions recorded yet. Use the form above to add your first transaction!
            </td>
          </tr>
        `;
        return;
      }

      transactionTableBody.innerHTML = json.data
        .map((tx) => {
          const isExpense = tx.type === 'expense';
          const formattedDate = new Date(tx.date).toLocaleDateString();
          return `
            <tr class="hover:bg-slate-700/30 transition">
              <td class="px-4 py-3 font-medium text-slate-400">${formattedDate}</td>
              <td class="px-4 py-3 font-semibold text-white">
                ${tx.title}
                ${tx.notes ? `<span class="block text-[10px] text-slate-400 font-normal">${tx.notes}</span>` : ''}
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-md text-[11px] bg-slate-700 text-slate-200">${tx.category}</span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isExpense
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }">
                  ${tx.type.toUpperCase()}
                </span>
              </td>
              <td class="px-4 py-3 font-mono font-bold ${isExpense ? 'text-rose-400' : 'text-emerald-400'}">
                ${isExpense ? '-' : '+'}$${Number(tx.amount).toFixed(2)}
              </td>
              <td class="px-4 py-3 text-right space-x-2">
                <button onclick="deleteTx('${tx._id}')" class="text-rose-400 hover:text-rose-300 transition" title="Delete">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  } catch (err) {
    console.error('Error loading transactions:', err);
  }
}

// Add Transaction
addTransactionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('txTitle').value;
  const amount = parseFloat(document.getElementById('txAmount').value);
  const type = document.getElementById('txType').value;
  const category = document.getElementById('txCategory').value;
  const date = document.getElementById('txDate').value;
  const notes = document.getElementById('txNotes').value;

  try {
    const res = await fetch('/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, amount, type, category, date, notes }),
    });

    const json = await res.json();
    if (json.success) {
      addTransactionForm.reset();
      document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
      await refreshAllData();
    } else {
      alert(`Error creating transaction: ${json.message || JSON.stringify(json.errors)}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
});

// Delete Transaction
window.deleteTx = async function (id) {
  if (!confirm('Are you sure you want to delete this transaction?')) return;

  try {
    const res = await fetch(`/transactions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.success) {
      await refreshAllData();
    } else {
      alert(`Error: ${json.message}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
};

// Filter and Search listeners
searchTxInput.addEventListener('input', () => loadTransactions());
filterType.addEventListener('change', () => loadTransactions());
refreshTxBtn.addEventListener('click', () => refreshAllData());

// Avatar Upload Handler (POST /upload/profile-picture)
avatarUploadInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('profilePicture', file);

  try {
    const res = await fetch('/upload/profile-picture', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const json = await res.json();
    if (json.success && json.data) {
      document.getElementById('userAvatar').src = json.data.profilePicture;
      alert('Profile picture uploaded successfully to Cloudinary!');
    } else {
      alert(`Upload failed: ${json.message}`);
    }
  } catch (err) {
    alert(`Error uploading avatar: ${err.message}`);
  }
});

// Admin Overview (GET /admin/overview)
adminBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/admin/overview', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();

    if (json.success && json.data) {
      const { summary, topExpenseCategories, uptime } = json.data;
      document.getElementById('adminModalContent').innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 bg-slate-900 rounded-lg border border-slate-700">
            <span class="text-[10px] text-slate-400">Total Users</span>
            <p class="text-lg font-bold text-indigo-400">${summary.totalUsers}</p>
          </div>
          <div class="p-3 bg-slate-900 rounded-lg border border-slate-700">
            <span class="text-[10px] text-slate-400">Total Transactions</span>
            <p class="text-lg font-bold text-white">${summary.totalTransactions}</p>
          </div>
          <div class="p-3 bg-slate-900 rounded-lg border border-slate-700">
            <span class="text-[10px] text-slate-400">Income Volume</span>
            <p class="text-lg font-bold text-emerald-400">$${summary.totalIncomeVolume.toLocaleString()}</p>
          </div>
          <div class="p-3 bg-slate-900 rounded-lg border border-slate-700">
            <span class="text-[10px] text-slate-400">Expense Volume</span>
            <p class="text-lg font-bold text-rose-400">$${summary.totalExpenseVolume.toLocaleString()}</p>
          </div>
        </div>

        <div class="space-y-2">
          <h4 class="font-semibold text-slate-200">Top Platform Spending Categories:</h4>
          <div class="space-y-1">
            ${
              topExpenseCategories.length > 0
                ? topExpenseCategories
                    .map(
                      (cat) => `
              <div class="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-700">
                <span class="font-medium">${cat.category} (${cat.count} txs)</span>
                <span class="font-bold text-rose-400">$${cat.totalSpent.toLocaleString()}</span>
              </div>
            `
                    )
                    .join('')
                : '<p class="text-slate-500">No expense records yet.</p>'
            }
          </div>
        </div>

        <div class="text-[11px] text-slate-500 flex justify-between border-t border-slate-700 pt-3">
          <span>Server Uptime: ${Math.floor(uptime)} seconds</span>
          <span class="text-emerald-400">● Status: Healthy</span>
        </div>
      `;
      adminModal.classList.remove('hidden');
    } else {
      alert(`Admin Access Denied: ${json.message}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
});

closeAdminModal.addEventListener('click', () => {
  adminModal.classList.add('hidden');
});
