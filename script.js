// Student's Expense Tracker - Core Logic
// IMPROVED: Added Constants to avoid typos
const TYPE_EXPENSE = 'expense';
const TYPE_INCOME = 'income';

// Helper: Sanitize Input to prevent XSS
function escapeHtml(text) {
  if (!text) return text;
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// --- CUSTOM MODAL SYSTEM ---
const modal = document.getElementById('confirm-modal');
const modalTitle = document.getElementById('modal-title');
const modalMsg = document.getElementById('modal-msg');
const btnCancel = document.getElementById('btn-cancel');
const btnConfirm = document.getElementById('btn-confirm');

let currentCallback = null; // Store the function to run if user clicks "Yes"

function showConfirm(title, message, onConfirm) {
  modalTitle.textContent = title;
  modalMsg.textContent = message;
  currentCallback = onConfirm;
  modal.classList.remove('hidden');
  modal.classList.add('active');
}

function closeConfirm() {
  modal.classList.remove('active');
  setTimeout(() => modal.classList.add('hidden'), 300); // Wait for animation
  currentCallback = null;
}

btnCancel.addEventListener('click', closeConfirm);

btnConfirm.addEventListener('click', () => {
  if (currentCallback) currentCallback();
  closeConfirm();
});

// Close if clicking outside the box
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeConfirm();
});

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
// IMPROVEMENT: Use the constants here so it matches the rest of the code
const defaultCategories = {
  [TYPE_EXPENSE]: ['Food', 'Travel', 'Books', 'Stationery', 'Entertainment', 'General', 'Other'],
  [TYPE_INCOME]: ['Pocket Money', 'Part-Time Job', 'Gift', 'Refund', 'Other Income']
};

// Try to load from memory, otherwise use defaults
let categories = JSON.parse(localStorage.getItem('customCategories')) || defaultCategories;

function saveCategories() {
  localStorage.setItem('customCategories', JSON.stringify(categories));
}

// 3. Initialize Data
let transactions = [];
try {
  const localData = localStorage.getItem('transactions');
  transactions = localData ? JSON.parse(localData) : [];
} catch (error) {
  console.error("Error parsing local storage data", error);
  transactions = [];
}

// Set default date to today
if (!dateEl.value) {
  const today = new Date().toISOString().slice(0, 10);
  dateEl.value = today;
}

// Helper: Format Currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(amount));
}

// Helper: Save to LocalStorage
function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// IMPROVEMENT: Use Date.now() for unique IDs instead of Math.random()
function generateId() {
  return Date.now(); 
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

// 5. Delete Transaction (Updated with Confirmation)
function deleteTransaction(id) {
  // 1. Find the transaction first so we can show its name
  const tx = transactions.find(t => t.id === Number(id));
  
  // Safety check: if not found, stop
  if (!tx) return;

  // 2. Show the Custom Confirmation Modal
  showConfirm(
    'Delete Transaction?', 
    `Are you sure you want to delete "${tx.description}"?`, 
    () => {
      // 3. This code runs ONLY if they click "Yes"
      transactions = transactions.filter(t => t.id !== Number(id));
      saveTransactions();
      renderTransactions();
      showToast('Transaction deleted successfully', 'success');
    }
  );
}

// 6. Edit Transaction Logic
let isEditing = false;
let editingId = null;

function editTransaction(id) {
  const transaction = transactions.find(t => t.id === Number(id));
  if (!transaction) return;
  isEditing = true;
  editingId = id;
  
  descriptionEl.value = transaction.description;
  amountEl.value = transaction.amount;
  typeEl.value = transaction.type;
  dateEl.value = transaction.date;
  updateCategoryOptions();
  categoryEl.value = transaction.category;
  
  const addBtn = document.getElementById('add-btn');
  addBtn.textContent = 'Update Transaction';
  addBtn.classList.add('secondary');
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
  const index = transactions.findIndex(t => t.id === Number(editingId));
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
    
    const addBtn = document.getElementById('add-btn');
    addBtn.textContent = 'Add Transaction';
    addBtn.classList.remove('secondary');
    
    dateEl.value = new Date().toISOString().slice(0, 10); 
    updateCategoryOptions(); 
  }
}

// 7. Render List & Update UI
function renderTransactions(txs) {
  if (!txs) {
    txs = transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  listEl.innerHTML = '';
  if (txs.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💸</div>
        <div class="empty-title">No transactions yet</div>
        <div class="empty-desc">Start by adding your income or expenses above to see your analytics.</div>
      </div>
    `;
    // We return here so we don't try to loop through empty data
    // Important: Update balance/charts to show 0 before returning
    updateBalance();
    updateCharts();
    return;
  }
  
  txs.forEach(t => {
    const li = document.createElement('li');
    // Ensure we use the right class for CSS styling
    li.classList.add(t.type); 
    const sign = t.type === TYPE_EXPENSE ? '-' : '+';
    
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
  // IMPROVED: Use Constants for type checking
  const income = transactions.filter(t => t.type === TYPE_INCOME).reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === TYPE_EXPENSE).reduce((acc, t) => acc + t.amount, 0);
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
  // IMPROVED: Use Constants
  const expenseItems = transactions.filter(t => t.type === TYPE_EXPENSE);
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
  const sorted = transactions.slice().sort((a,b) => new Date(a.date) - new Date(b.date));
  let running = 0;
  
  sorted.forEach(t => {
    // IMPROVED: Use Constants
    running += (t.type === TYPE_INCOME ? Number(t.amount) : -Number(t.amount));
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
  const currentType = document.getElementById('type').value;
  const cats = categories[currentType];
  const catSelect = document.getElementById('category');
  
  catSelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
  
  cats.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat; 
    option.textContent = cat; 
    catSelect.appendChild(option);
  });
  
  const filterCat = document.getElementById('filter-category');
  filterCat.innerHTML = '<option value="all">All Categories</option>';
  
  // Combine all unique categories
  const allCats = [...new Set([...categories[TYPE_EXPENSE], ...categories[TYPE_INCOME]])].sort();
  allCats.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat; 
    option.textContent = cat; 
    filterCat.appendChild(option);
  });
}

// 9. Filters & Exports
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
  }).sort((a,b) => new Date(b.date) - new Date(a.date));
  
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
  txForm.reset(); 
  dateEl.value = new Date().toISOString().slice(0, 10); 
  isEditing = false; 
  editingId = null;
  const addBtn = document.getElementById('add-btn');
  addBtn.textContent = 'Add Transaction';
  addBtn.classList.remove('secondary');
  updateCategoryOptions(); 
});

// 10. Event Listeners
applyFiltersBtn.addEventListener('click', applyFilters);
clearFiltersBtn.addEventListener('click', clearFilters);
exportCsvBtn.addEventListener('click', exportToCsv);
downloadPdfBtn.addEventListener('click', downloadPdf);

clearAllBtn.addEventListener('click', () => {
  showConfirm(
    'Clear All Data?', 
    'This will permanently delete all transactions. This action cannot be undone.', 
    () => {
      // This code runs only if they click "Yes"
      transactions = []; 
      saveTransactions(); 
      renderTransactions(); 
      showToast('All data has been cleared.', 'info');
    }
  );
});

typeEl.addEventListener('change', updateCategoryOptions);
document.getElementById('search-text').addEventListener('input', applyFilters);

// Dark Mode Logic
const themeBtn = document.getElementById('theme-toggle');
if (localStorage.getItem('theme') === 'dark') { 
  document.body.classList.add('dark-mode'); 
  themeBtn.textContent = '☀️ Light Mode'; 
}

themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// Budget Setting
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

document.getElementById('reset-budget-btn').addEventListener('click', () => {
  if (!localStorage.getItem('budgetLimit')) {
    showToast('No budget limit to reset!', 'info');
    return;
  }
  
  showConfirm(
    'Remove Budget?',
    'Are you sure you want to remove the monthly budget limit?',
    () => {
      localStorage.removeItem('budgetLimit');
      updateBalance();
      showToast('Budget limit removed successfully', 'success');
    }
  );
});

// Add Category Logic
document.getElementById('add-cat-btn').addEventListener('click', () => {
  const currentType = document.getElementById('type').value;
  const newCat = prompt(`Enter new ${currentType} category name:`);
  
  if (newCat && newCat.trim() !== "") {
    const formattedCat = newCat.trim();
    if (!categories[currentType].includes(formattedCat)) {
      categories[currentType].push(formattedCat); 
      saveCategories(); 
      updateCategoryOptions(); 
      document.getElementById('category').value = formattedCat;
      showToast(`Category "${formattedCat}" added!`, 'success');
    } else {
      showToast('Category already exists!', 'error');
    }
  }
});

// Remove Category Logic
document.getElementById('del-cat-btn').addEventListener('click', () => {
  const currentType = document.getElementById('type').value;
  const selectedCat = document.getElementById('category').value;

  if (!selectedCat) {
    showToast('Please select a category to remove first!', 'error');
    return;
  }

  if (defaultCategories[currentType].includes(selectedCat)) {
    showToast('You cannot delete default categories.', 'error');
    return;
  }

  showConfirm(
    'Delete Category?',
    `Are you sure you want to delete the custom category "${selectedCat}"?`,
    () => {
      const index = categories[currentType].indexOf(selectedCat);
      if (index > -1) {
        categories[currentType].splice(index, 1); 
        saveCategories(); 
        updateCategoryOptions(); 
        showToast(`Category "${selectedCat}" removed.`, 'info');
      }
    }
  );
});

// Date Filter Logic
function setDateFilter(range) {
  const now = new Date();
  let start, end;
  let label = '';

  if (range === 'thisMonth') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    label = "This Month";
  } else if (range === 'lastMonth') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
    label = "Last Month";
  } else if (range === 'last30') {
    end = new Date();
    start = new Date();
    start.setDate(end.getDate() - 30);
    label = "Last 30 Days"; 
  }

  const fmt = (d) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  }

  document.getElementById('filter-from').value = fmt(start);
  document.getElementById('filter-to').value = fmt(end);
  
  applyFilters();
  showToast(`Showing data for: ${label}`, 'info');
}

// Initial Load
updateCategoryOptions();
renderTransactions();