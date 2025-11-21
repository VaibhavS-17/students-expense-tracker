// script.js - Expense tracker logic (Final Mobile-Safe Version)

// ---- Select DOM elements ----
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

// Charts
let pieChart = null;
let lineChart = null;

// Define categories
const categories = {
  expense: ['Food', 'Travel', 'Books', 'Stationery', 'Entertainment', 'General', 'Other'],
  income: ['Pocket Money', 'Part-Time Job', 'Gift', 'Refund', 'Other Income']
};

// ---- Data ----
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Ensure date input has default today value
if (!dateEl.value) {
  const today = new Date().toISOString().slice(0,10);
  dateEl.value = today;
}

// ---- Utility Functions ----
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function generateId() {
  return Math.floor(Math.random() * 10000000);
}

// ---- Main Transaction Logic ----
function addTransaction(e) {
  e.preventDefault();

  const description = descriptionEl.value.trim();
  const amount = Number(amountEl.value.trim());
  const category = categoryEl.value;
  const date = dateEl.value;
  const type = typeEl.value;

  const isAmountValid = !isNaN(amount) && isFinite(amount) && amount > 0;

  if (description === '' || !isAmountValid || category === '') {
    alert('Please enter a valid description, amount, and category.');
    return;
  }

  const transaction = {
    id: generateId(),
    description,
    amount,
    category,
    date,
    type
  };

  transactions.push(transaction);
  saveTransactions();
  renderTransactions();
  txForm.reset();
  dateEl.value = new Date().toISOString().slice(0,10); 
  updateCategoryOptions();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  renderTransactions();
}

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

function renderTransactions(txs = transactions) {
  listEl.innerHTML = '';
  if (txs.length === 0) {
    listEl.innerHTML = '<li style="justify-content:center; color:#6c7a86;">No transactions found.</li>';
  }

  txs.forEach(t => {
    const li = document.createElement('li');
    li.classList.add(t.type);

    const sign = t.type === 'expense' ? '-' : '+';
    const amountClass = t.type;
    
    li.innerHTML = `
      <div class="tx-left">
          <div class="tx-details">
              <span class="tx-desc">${t.description}</span>
              <div class="tx-meta">
                  <span>${t.category}</span>
                  <span>|</span>
                  <span>${t.date}</span>
              </div>
          </div>
      </div>
      <div class="tx-right">
          <span class="tx-amount ${amountClass}">${sign} ${formatCurrency(Math.abs(t.amount))}</span>
          <button class="edit-btn" data-id="${t.id}" title="Edit Transaction">✏️</button>
          <button class="delete-btn" data-id="${t.id}" title="Delete Transaction">✖</button>
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
  incomeEl.classList.remove('value-expense');
  incomeEl.classList.add('value-income');

  expenseEl.textContent = formatCurrency(expense);
  expenseEl.classList.remove('value-income'); 
  expenseEl.classList.add('value-expense');

  balanceEl.textContent = formatCurrency(total);
  balanceEl.classList.remove('value-income', 'value-expense');
  if (total < 0) {
    balanceEl.classList.add('value-expense');
  } else if (total > 0) {
    balanceEl.classList.add('value-income');
  }
}

// ---- Charts (Fixed: Instant render for PDF) ----
function updateCharts() {
  const expenseItems = transactions.filter(t => t.type === 'expense');
  const catMap = {};
  expenseItems.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount); });

  const pieLabels = Object.keys(catMap);
  const pieData = Object.values(catMap);

  if (pieChart) { pieChart.destroy(); pieChart = null; }
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: pieLabels.length ? pieLabels : ['No data'],
      datasets: [{
        data: pieData.length ? pieData : [1],
        backgroundColor: pieData.length 
          ? ['#ff6b6b','#ffd166','#06d6a0','#4d96ff','#9b5de5','#f15bb5']
          : ['#e2e8f0'], 
        borderWidth: 0
      }]
    },
    options: { 
      responsive: true,
      maintainAspectRatio: false, // Important for Mobile
      animation: { duration: 0 }, // FIX: No animation, so it shows in PDF
      plugins: { legend: { position: 'bottom' } } 
    }
  });

  const dateMap = {};
  const sorted = transactions.slice().sort((a,b) => new Date(a.date) - new Date(b.date));
  let running = 0;
  sorted.forEach(t => {
    const key = t.date;
    running += (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
    dateMap[key] = running; 
  });

  const lineLabels = Object.keys(dateMap);
  const lineData = Object.values(dateMap);

  if (lineChart) { lineChart.destroy(); lineChart = null; }
  const lineCtx = document.getElementById('lineChart').getContext('2d');
  lineChart = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: lineLabels.length ? lineLabels : ['No data'],
      datasets: [{
        label: 'Balance',
        data: lineData.length ? lineData : [0],
        fill: true,
        backgroundColor: 'rgba(42,157,143,0.12)',
        borderColor: '#2a9d8f',
        tension: 0.25,
        pointRadius: 3
      }]
    },
    options: { 
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 }, // FIX: No animation, so it shows in PDF
      scales: { y: { beginAtZero: false } }, 
      plugins: { legend: { display: false } } 
    }
  });
}

function updateCategoryOptions() {
  const currentType = typeEl.value;
  const cats = categories[currentType];
  
  categoryEl.innerHTML = '<option value="" disabled>Select Category</option>';
  
  cats.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryEl.appendChild(option);
  });
  
  if (categoryEl.options.length > 1) {
    categoryEl.options[1].selected = true;
  }
  
  filterCategory.innerHTML = '<option value="all">All Categories</option>';
  const allCategories = [...new Set([...categories.expense, ...categories.income])];
  allCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    filterCategory.appendChild(option);
  });
}

function applyFilters() {
  const sText = document.getElementById('search-text').value.toLowerCase();
  const cat = filterCategory.value;
  const from = filterFrom.value;
  const to = filterTo.value;

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  
  const filtered = transactions.filter(t => {
    if (sText && !t.description.toLowerCase().includes(sText)) return false;
    if (cat !== 'all' && t.category !== cat) return false;
    
    const transactionDate = new Date(t.date);
    if (fromDate && transactionDate < fromDate) return false;
    if (toDate && transactionDate > toDate) return false;
    
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
  if (!transactions.length) { alert('No data to export'); return; }
  const header = ['id','date','description','category','type','amount'];
  const rows = transactions.map(t => [t.id, t.date, `"${t.description.replace(/"/g,'""')}"`, t.category, t.type, t.amount]);
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expense_tracker_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Download Professional PDF (Mobile Safe) ----
function downloadPdf() {
  // 1. Scroll to top
  window.scrollTo(0, 0);

  const element = document.getElementById('report-area');
  const balanceCards = document.querySelector('.balance-container');
  
  // 2. PREPARE FOR PRINT: Add styling class
  element.classList.add('printing'); 
  
  // 3. Inject Custom Header (Title + Date)
  const titleDiv = document.createElement('div');
  titleDiv.innerHTML = `
    <h1 style="text-align:center; color:#000; margin-bottom:5px;">Expense Report</h1>
    <p style="text-align:center; color:#444; margin-bottom:20px; font-size:12px;">
      Generated on: ${new Date().toLocaleDateString()} | Student's Expense Tracker
    </p>
    <hr style="border:0; border-top:1px solid #000; margin-bottom:20px;">
  `;
  
  // 4. Clone Balance Cards (So we see totals in the PDF!)
  const summaryClone = balanceCards.cloneNode(true);
  
  // Insert Header & Balance Cards at the TOP of the report area
  element.prepend(summaryClone);
  element.prepend(titleDiv);

  // 5. Generate PDF
  const opt = {
    margin:       0.3,
    filename:     `Expense_Report_${new Date().toISOString().slice(0,10)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { 
      scale: 1,       // FIX: Prevents Mobile Crash
      useCORS: true, 
      scrollY: 0      // FIX: Prevents Blank PDF
    },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save()
    .then(() => {
      // 6. CLEANUP: Remove the temporary elements after download
      element.classList.remove('printing');
      element.removeChild(titleDiv);
      element.removeChild(summaryClone);
    })
    .catch(err => {
      console.error("PDF Error:", err);
      // Emergency cleanup in case of error
      element.classList.remove('printing');
      if(element.contains(titleDiv)) element.removeChild(titleDiv);
      if(element.contains(summaryClone)) element.removeChild(summaryClone);
    });
}

function clearAllData() {
  if (confirm('Are you sure you want to clear ALL transaction data? This action cannot be undone.')) {
    transactions = [];
    saveTransactions();
    renderTransactions();
  }
}

resetBtn.addEventListener('click', () => { 
  txForm.reset(); 
  dateEl.value = new Date().toISOString().slice(0,10); 
  if (isEditing) {
    isEditing = false;
    editingId = null;
    document.getElementById('add-btn').textContent = 'Add Transaction';
    document.getElementById('add-btn').classList.remove('secondary');
  }
  updateCategoryOptions(); 
});

applyFiltersBtn.addEventListener('click', applyFilters);
clearFiltersBtn.addEventListener('click', clearFilters);
exportCsvBtn.addEventListener('click', exportToCsv);
downloadPdfBtn.addEventListener('click', downloadPdf);
clearAllBtn.addEventListener('click', clearAllData);

typeEl.addEventListener('change', updateCategoryOptions);

document.getElementById('search-text').addEventListener('input', function() {
  applyFilters();
});

// Initial render
updateCategoryOptions();
renderTransactions();

// ---- Dark Mode Logic ----

const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

// 1. Check LocalStorage on load
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
  body.classList.add('dark-mode');
  themeToggleBtn.textContent = '☀️ Light Mode';
}

// 2. Toggle on click
themeToggleBtn.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  
  if (body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
    themeToggleBtn.textContent = '☀️ Light Mode';
  } else {
    localStorage.setItem('theme', 'light');
    themeToggleBtn.textContent = '🌙 Dark Mode';
  }
});
