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

// Helper
function animateNumber({ from, to, duration, onUpdate }) {
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const value = from + (to - from) * eased;

    onUpdate(value);

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
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
let animatedTotal = 0;

// 2. Category Configuration
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

// 5. Delete Transaction
function deleteTransaction(id) {
  const tx = transactions.find(t => t.id === Number(id));
  if (!tx) return;

  showConfirm(
    'Delete Transaction?', 
    `Are you sure you want to delete "${tx.description}"?`, 
    () => {
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
    updateBalance();
    updateCharts();
    return;
  }
  
  txs.forEach(t => {
    const li = document.createElement('li');
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

// 8. Chart Logic (UPDATED: Fixed Text Overlap)
function updateCharts() {
  // --- 1. PREPARE DATA ---
  const expenseItems = transactions.filter(t => t.type === TYPE_EXPENSE);
  const catMap = {};
  let totalExpense = 0; 

  expenseItems.forEach(t => { 
    const val = Number(t.amount);
    catMap[t.category] = (catMap[t.category] || 0) + val; 
    totalExpense += val;
  });
  
  const pieLabels = Object.keys(catMap);
  const pieData = Object.values(catMap);


  // Check Theme for Dynamic Colors
  const isDark = document.body.classList.contains('dark-mode');
  const cardBg = isDark ? '#1e1e1e' : '#ffffff'; 
  const textColor = isDark ? '#e0e0e0' : '#333333';

  // --- 2. DOUGHNUT CHART ---
  if (pieChart) { pieChart.destroy(); }
  
  pieChart = new Chart(document.getElementById('pieChart').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: pieLabels.length ? pieLabels : ['No data'],
      datasets: [{
        data: pieData.length ? pieData : [1],
        backgroundColor: pieData.length 
          ? ['#ff6b6b','#4ecdc4','#ffe66d','#1a535c','#ff9f1c','#2a9d8f'] 
          : ['#e2e8f0'], 
        borderColor: cardBg,
        borderWidth: 3,
        hoverOffset: 4,     
        borderRadius: 4,     
        cutout: '68%',       
      }]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false, 
      animation: { animateScale: true, animateRotate: true },
      layout: { padding: 10 },
      plugins: { 
        legend: { 
          position: 'right', 
          labels: {
            color: textColor,
            usePointStyle: true,
            boxWidth: 8,
            font: { family: "'Poppins', sans-serif", size: 11 }
          }
        },
        tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            callbacks: {
                label: function(context) {
                    let label = context.label || '';
                    if (label) { label += ': '; }
                    if (context.parsed !== null) {
                        label += formatCurrency(context.parsed);
                    }
                    return label;
                }
            }
        }
      } 
    },
     plugins: [{
      id: 'textCenter',
      beforeDraw(chart) {
  if (!pieData.length) return;

  const ctx = chart.ctx;
  const { left, right, top, bottom } = chart.chartArea;

  const centerX = left + (right - left) / 2;
  const centerY = top + (bottom - top) / 2;

  ctx.save();

  // Label
  ctx.font = "500 13px Poppins";
  ctx.fillStyle = "#888";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Total", centerX, centerY - 16);

  // Amount (animated)
  ctx.font = "700 18px Poppins";
  ctx.fillStyle = chart.options.plugins.legend.labels.color;
  ctx.fillText(
    formatCurrency(Math.round(animatedTotal)),
    centerX,
    centerY + 10
  );

  ctx.restore();
}
    }]
  });
  
animatedTotal = 0;

animateNumber({
  from: animatedTotal,
  to: totalExpense,
  duration: 900,
  onUpdate: (val) => {
    animatedTotal = val;
    pieChart.draw();
  }
});
  // --- 3. GRADIENT LINE CHART ---
  const dateMap = {};
  const sorted = transactions.slice().sort((a,b) => new Date(a.date) - new Date(b.date));
  let running = 0;
  
  sorted.forEach(t => {
    running += (t.type === TYPE_INCOME ? Number(t.amount) : -Number(t.amount));
    dateMap[t.date] = running; 
  });
  
  const lineLabels = Object.keys(dateMap);
  const lineData = Object.values(dateMap);

  const ctx = document.getElementById('lineChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(42, 157, 143, 0.5)');
  gradient.addColorStop(1, 'rgba(42, 157, 143, 0.0)');

  if (lineChart) { lineChart.destroy(); }
  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: lineLabels.length ? lineLabels : ['No data'],
      datasets: [{
        label: 'Balance', 
        data: lineData.length ? lineData : [0], 
        fill: true,
        backgroundColor: gradient,
        borderColor: '#2a9d8f',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: cardBg, 
        pointBorderColor: '#2a9d8f'
      }]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false, 
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: { 
        legend: { display: false },
        tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#fff',
            bodyColor: '#fff'
        }
      },
      scales: {
          x: { 
            grid: { display: false }, 
            ticks: { color: textColor } 
          },
          y: { 
            beginAtZero: false,
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            ticks: { color: textColor }
          }
      }
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
  renderTransactions(transactions); 
  showToast('Filters cleared', 'info');
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
  updateCharts();
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

// =========================================
// 11. ADVANCED FEATURES (Backup & Restore)
// =========================================

// A. Backup Data (Download JSON)
document.getElementById('btn-backup').addEventListener('click', () => {
  const data = {
    transactions: transactions,
    categories: categories,
    budgetLimit: localStorage.getItem('budgetLimit'),
    lastBackup: new Date().toISOString()
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "expense_tracker_backup.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  
  showToast('Backup file saved successfully!', 'success');
});

// B. Restore Data (Trigger Input)
const fileInput = document.getElementById('import-file');
document.getElementById('btn-restore').addEventListener('click', () => {
  showConfirm(
    'Restore Data?',
    'This will OVERWRITE your current data with the backup file. Are you sure?',
    () => fileInput.click() 
  );
});

// C. Process Uploaded File
fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);

      if (!Array.isArray(importedData.transactions)) {
        throw new Error("Invalid file format");
      }

      transactions = importedData.transactions;
      if (importedData.categories) categories = importedData.categories;
      if (importedData.budgetLimit) localStorage.setItem('budgetLimit', importedData.budgetLimit);

      saveTransactions();
      saveCategories();
      
      renderTransactions();
      updateCategoryOptions();
      updateBalance();
      
      showToast('Data restored successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error: Invalid Backup File', 'error');
    }
    fileInput.value = '';
  };
  reader.readAsText(file);
});

// =========================================
// 12. KEYBOARD SHORTCUTS
// =========================================
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== descriptionEl) {
    e.preventDefault(); 
    document.getElementById('search-text').focus();
  }

  if (e.key === 'Escape') {
    if (modal.classList.contains('active')) {
      closeConfirm();
      return;
    }
    clearFilters();
    document.activeElement.blur(); 
  }
});

// Helper: Quick Fill Form
function quickFill(desc, amount, cat) {
    document.getElementById('description').value = desc;
    document.getElementById('amount').value = amount;
    
    document.getElementById('type').value = 'expense';
    updateCategoryOptions(); 
    document.getElementById('category').value = cat;
}

// Initial Load
updateCategoryOptions();
renderTransactions();