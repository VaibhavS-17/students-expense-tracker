// Student's Expense Tracker - Core Logic (UPDATED)

function escapeHtml(text) {
  if (!text) return text;
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// --- TOAST NOTIFICATION SYSTEM ---
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
document.body.appendChild(toastContainer);

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';
  
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// 1. Select DOM Elements
const txForm = document.getElementById('tx-form');
const descriptionEl = document.getElementById('description');
const amountEl = document.getElementById('amount');
const categoryEl = document.getElementById('category');
const dateEl = document.getElementById('date');
const typeEl = document.getElementById('type');

const listEl = document.getElementById('list');
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');

const searchText = document.getElementById('search-text');
const filterCategory = document.getElementById('filter-category');
const filterFrom = document.getElementById('filter-from');
const filterTo = document.getElementById('filter-to');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');

const exportCsvBtn = document.getElementById('export-csv');
const downloadPdfBtn = document.getElementById('download-pdf');
const clearAllBtn = document.getElementById('clear-all');
const resetBtn = document.getElementById('reset-btn');

let pieChart = null;
let lineChart = null;

// 2. Category Configuration
const categories = {
  expense: ['Food', 'Travel', 'Books', 'Stationery', 'Entertainment', 'General', 'Other'],
  income: ['Pocket Money', 'Part-Time Job', 'Gift', 'Refund', 'Other Income']
};

// 3. Initialize Data (UPDATED: Safer Parsing)
let transactions = [];
try {
  const localData = localStorage.getItem('transactions');
  transactions = localData ? JSON.parse(localData) : [];
} catch (error) {
  console.error("Error parsing local storage data", error);
  transactions = []; // Fallback to empty if corrupted
}

// Set default date to today
if (!dateEl.value) {
  const today = new Date().toISOString().slice(0,10);
  dateEl.value = today;
}

// Helper: Format Currency (UPDATED: Math.abs to prevent -0)
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(amount));
}

// Helper: Save to LocalStorage
function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function generateId() {
  return Math.floor(Math.random() * 10000000);
}

// 4. Add Transaction Logic
function addTransaction(e) {
  e.preventDefault();
  const description = descriptionEl.value.trim();
  const amount = Number(amountEl.value.trim());
  const category = categoryEl.value;
  const date = dateEl.value;
  const type = typeEl.value;

  if (description === '' || isNaN(amount) || amount <= 0 || category === '') {
    showToast('Please fill in all fields correctly!', 'error');
    return;
  }

  const transaction = { id: generateId(), description, amount, category, date, type };
  transactions.unshift(transaction);
  saveTransactions();
  renderTransactions();
  txForm.reset();
  dateEl.value = new Date().toLocaleDateString('en-CA'); 
  updateCategoryOptions();
  
  showToast('Transaction added successfully!', 'success');
}

// 5. Delete Transaction
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  renderTransactions();
}

// 6. Edit Transaction Logic
let isEditing = false;
let editingId = null;

function editTransaction(id) {
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) return;
  isEditing = true;
  editingId = id;
  descriptionEl.value = transaction.description;
  amountEl.value = transaction.amount;
  typeEl.value = transaction.type;
  dateEl.value = transaction.date;
  updateCategoryOptions();
  categoryEl.value = transaction.category;
  document.getElementById('add-btn').textContent = 'Update Transaction';
  document.getElementById('add-btn').classList.add('secondary');
  descriptionEl.focus();
}

txForm.addEventListener('submit', function (e) {
  if (isEditing) {
    e.preventDefault();
    updateTransaction();
  } else {
    addTransaction(e);
  }
});

function updateTransaction() {
  const index = transactions.findIndex(t => t.id === editingId);
  if (index !== -1) {
    transactions[index].description = descriptionEl.value.trim();
    transactions[index].amount = Number(amountEl.value.trim());
    transactions[index].category = categoryEl.value;
    transactions[index].date = dateEl.value;
    transactions[index].type = typeEl.value;
    saveTransactions();
    renderTransactions();
    isEditing = false;
    editingId = null;
    txForm.reset();
    document.getElementById('add-btn').textContent = 'Add Transaction';
    document.getElementById('add-btn').classList.remove('secondary');
    dateEl.value = new Date().toISOString().slice(0,10); 
    updateCategoryOptions(); 
  }
}

// 7. Render List & Update UI (UPDATED: Default Sorting)
function renderTransactions(txs) {
  // Default: Sort by Date Descending (Newest First) if no filter is applied
   if (!txs) {
    txs = transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
   }

  listEl.innerHTML = '';
  if (txs.length === 0) {
    listEl.innerHTML = '<li style="justify-content:center; color:#6c7a86;">No transactions found.</li>';
  }
  txs.forEach(t => {
    const li = document.createElement('li');
    li.classList.add(t.type);
    const sign = t.type === 'expense' ? '-' : '+';
    li.innerHTML = `
      <div class="tx-left">
          <div class="tx-details">
              <span class="tx-desc">${escapeHtml(t.description)}</span>
              <div class="tx-meta">
                  <span>${t.category}</span>
                  <span>|</span>
                  <span>${new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
          </div>
      </div>
      <div class="tx-right">
          <span class="tx-amount ${t.type}">${sign} ${formatCurrency(Math.abs(t.amount))}</span>
          <button class="edit-btn" data-id="${t.id}">✏️</button>
          <button class="delete-btn" data-id="${t.id}">✖</button>
      </div>
    `;
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTransaction(t.id));
    li.querySelector('.edit-btn').addEventListener('click', () => editTransaction(t.id));
    listEl.appendChild(li);
  });
  updateBalance();
  updateCharts();
}

function updateBalance() {
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const total = income - expense;
  incomeEl.textContent = formatCurrency(income);
  incomeEl.className = 'value value-income';
  expenseEl.textContent = formatCurrency(expense);
  expenseEl.className = 'value value-expense';
  balanceEl.textContent = formatCurrency(total);
  balanceEl.className = total < 0 ? 'value value-expense' : 'value value-income';
  
  // Budget Logic
  let budgetLimit = Number(localStorage.getItem('budgetLimit')) || 0;
  const budgetBar = document.getElementById('budget-bar');
  const budgetText = document.getElementById('budget-text');
  const budgetVal = document.getElementById('budget-val');

  if (budgetLimit > 0) {
    const percent = Math.min((expense / budgetLimit) * 100, 100);
    budgetBar.style.width = `${percent}%`;
    budgetVal.textContent = `Limit: ${formatCurrency(budgetLimit)}`;
    
    if (expense > budgetLimit) {
      budgetBar.style.backgroundColor = '#e63946'; // Red
      budgetText.innerHTML = `⚠️ Over Budget! (${Math.round((expense/budgetLimit)*100)}%)`;
      budgetText.style.color = '#e63946';
    } else if (percent > 80) {
      budgetBar.style.backgroundColor = '#e9c46a'; // Yellow
      budgetText.innerHTML = `⚠️ Warning: ${Math.round(percent)}% Used`;
      budgetText.style.color = '#e9c46a';
    } else {
      budgetBar.style.backgroundColor = '#2a9d8f'; // Teal
      budgetText.innerHTML = `Spending: ${Math.round(percent)}%`;
      budgetText.style.color = 'var(--muted)';
    }
  } else {
    budgetBar.style.width = '0%';
    budgetBar.style.backgroundColor = '#e0e0e0';
    budgetText.innerHTML = "<i>No monthly limit set</i>";
    budgetVal.textContent = "";
  }
}

// 8. Chart Logic
function updateCharts() {
  const expenseItems = transactions.filter(t => t.type === 'expense');
  const catMap = {};
  expenseItems.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount); });
  const pieLabels = Object.keys(catMap);
  const pieData = Object.values(catMap);

  if (pieChart) { pieChart.destroy(); }
  pieChart = new Chart(document.getElementById('pieChart').getContext('2d'), {
    type: 'pie',
    data: {
      labels: pieLabels.length ? pieLabels : ['No data'],
      datasets: [{
        data: pieData.length ? pieData : [1],
        backgroundColor: pieData.length ? ['#ff6b6b','#ffd166','#06d6a0','#4d96ff','#9b5de5','#f15bb5'] : ['#e2e8f0'], 
        borderWidth: 0
      }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, 
      plugins: { legend: { position: 'bottom' } } 
    }
  });

  const dateMap = {};
  // Sort for chart chronologically (Oldest -> Newest)
  const sorted = transactions.slice().sort((a,b) => new Date(a.date) - new Date(b.date));
  let running = 0;
  sorted.forEach(t => {
    running += (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
    dateMap[t.date] = running; 
  });
  const lineLabels = Object.keys(dateMap);
  const lineData = Object.values(dateMap);

  if (lineChart) { lineChart.destroy(); }
  lineChart = new Chart(document.getElementById('lineChart').getContext('2d'), {
    type: 'line',
    data: {
      labels: lineLabels.length ? lineLabels : ['No data'],
      datasets: [{
        label: 'Balance', data: lineData.length ? lineData : [0], fill: true,
        backgroundColor: 'rgba(42,157,143,0.12)', borderColor: '#2a9d8f', tension: 0.25, pointRadius: 3
      }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
      scales: { y: { beginAtZero: false } }, plugins: { legend: { display: false } } 
    }
  });
}

function updateCategoryOptions() {
  const currentType = typeEl.value;
  const cats = categories[currentType];
  categoryEl.innerHTML = '<option value="" disabled>Select Category</option>';
  cats.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat; option.textContent = cat; categoryEl.appendChild(option);
  });
  if (categoryEl.options.length > 1) categoryEl.options[1].selected = true;
  
  filterCategory.innerHTML = '<option value="all">All Categories</option>';
  [...new Set([...categories.expense, ...categories.income])].forEach(cat => {
    const option = document.createElement('option');
    option.value = cat; option.textContent = cat; filterCategory.appendChild(option);
  });
}

// 9. Filters & Exports (UPDATED: Case Insensitive Search)
function applyFilters() {
  const sText = document.getElementById('search-text').value.trim().toLowerCase();
  const cat = filterCategory.value;
  const from = filterFrom.value ? new Date(filterFrom.value) : null;
  const to = filterTo.value ? new Date(filterTo.value) : null;
  
  const filtered = transactions.filter(t => {
    if (sText && !t.description.toLowerCase().includes(sText)) return false;
    if (cat !== 'all' && t.category !== cat) return false;
    const tDate = new Date(t.date);
    if (from && tDate < from) return false;
    if (to && tDate > to) return false;
    return true;
  }).sort((a,b) => new Date(b.date) - new Date(a.date)); // Always sort filtered results by date desc
  renderTransactions(filtered);
}

function clearFilters() {
  document.getElementById('search-text').value = '';
  filterCategory.value = 'all';
  filterFrom.value = '';
  filterTo.value = '';
  renderTransactions();
}

function exportToCsv() {
  if (!transactions.length) { 
    showToast('No data available to export!', 'error'); 
    return; 
  }
  
  const header = ['id','date','description','category','type','amount'];
  const rows = transactions.map(t => [
    t.id, 
    t.date, 
    `"${t.description.replace(/"/g,'""')}"`, 
    t.category, 
    t.type, 
    t.amount
  ]);
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; 
  a.download = `expense_tracker_${new Date().toLocaleDateString('en-CA')}.csv`;
  a.click();
  
  showToast('CSV file downloaded!', 'success');
}

function downloadPdf() {
  window.scrollTo(0, 0);
  const element = document.getElementById('report-area');
  const balanceCards = document.querySelector('.balance-container');
  element.classList.add('printing'); 
  
  const titleDiv = document.createElement('div');
  titleDiv.innerHTML = `<h1 style="text-align:center;color:#000;">Expense Report</h1><p style="text-align:center;color:#444;">${new Date().toLocaleDateString()}</p><hr style="margin-bottom:20px;">`;
  const summaryClone = balanceCards.cloneNode(true);
  element.prepend(summaryClone);
  element.prepend(titleDiv);

  html2pdf().set({
    margin: 0.3, filename: `Expense_Report.pdf`, image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 1, useCORS: true, scrollY: 0 }, jsPDF: { unit: 'in', format: 'a4' }
  }).from(element).save().then(() => {
    element.classList.remove('printing');
    element.removeChild(titleDiv);
    element.removeChild(summaryClone);
  });
}

function clearAllData() {
  if (confirm('Are you sure you want to Clear ALL data? This cannot be undone.')) { 
    transactions = []; 
    saveTransactions(); 
    renderTransactions(); 
    showToast('All data has been cleared.', 'info');
  }
}

resetBtn.addEventListener('click', () => { 
  txForm.reset(); dateEl.value = new Date().toISOString().slice(0,10); 
  isEditing = false; editingId = null;
  document.getElementById('add-btn').textContent = 'Add Transaction';
  document.getElementById('add-btn').classList.remove('secondary');
  updateCategoryOptions(); 
});

// 10. Event Listeners
applyFiltersBtn.addEventListener('click', applyFilters);
clearFiltersBtn.addEventListener('click', clearFilters);
exportCsvBtn.addEventListener('click', exportToCsv);
downloadPdfBtn.addEventListener('click', downloadPdf);
clearAllBtn.addEventListener('click', clearAllData);
typeEl.addEventListener('change', updateCategoryOptions);
document.getElementById('search-text').addEventListener('input', applyFilters);

// Dark Mode Logic
const themeBtn = document.getElementById('theme-toggle');
if (localStorage.getItem('theme') === 'dark') { document.body.classList.add('dark-mode'); themeBtn.textContent = '☀️ Light Mode'; }
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  themeBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// Initial Load
updateCategoryOptions();
renderTransactions();

// Budget Setting Event Listener
document.getElementById('set-budget-btn').addEventListener('click', () => {
  const currentLimit = localStorage.getItem('budgetLimit') || 0;
  const input = prompt("Enter your monthly budget limit (₹):", currentLimit);
  
  if (input !== null && !isNaN(input) && Number(input) > 0) {
    localStorage.setItem('budgetLimit', input);
    updateBalance(); 
    showToast(`Budget limit set to ₹${input}`, 'success');
  } else if (input !== null) {
    showToast('Please enter a valid number!', 'error');
  }
});

// Reset Budget Event Listener
document.getElementById('reset-budget-btn').addEventListener('click', () => {
  // Check if a budget is currently set
  if (!localStorage.getItem('budgetLimit')) {
    showToast('No budget limit to reset!', 'info');
    return;
  }

  if (confirm("Are you sure you want to remove the monthly budget limit?")) {
    localStorage.removeItem('budgetLimit'); // Remove from storage
    updateBalance(); // Refresh the progress bar
    showToast('Budget limit removed successfully', 'success');
  }
});