// ============================================================
// 1. STATE
// ============================================================
let transactions = [];
let editingId = null;
let myChart = null;

// ============================================================
// 2. DOM REFS
// ============================================================
const form = document.getElementById('transactionForm');
const descInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const typeRadios = document.querySelectorAll('input[name="type"]');
const submitBtn = document.getElementById('submitBtn');
const formTitle = document.getElementById('formTitle');

const balanceDisplay = document.getElementById('balanceDisplay');
const incomeDisplay = document.getElementById('incomeDisplay');
const expenseDisplay = document.getElementById('expenseDisplay');
const savingsDisplay = document.getElementById('savingsDisplay');
const transactionList = document.getElementById('transactionList');
const monthFilter = document.getElementById('monthFilter');
const darkToggle = document.getElementById('darkModeToggle');
const chartCanvas = document.getElementById('expenseChart');
const chartEmptyMsg = document.getElementById('chartEmptyMsg');
const currentMonthDisplay = document.getElementById('currentMonthDisplay');
const listMonthLabel = document.getElementById('listMonthLabel');
const txCountBadge = document.getElementById('txCountBadge');
const topCategoryBadge = document.getElementById('topCategoryBadge');
const toastContainer = document.getElementById('toastContainer');

// ============================================================
// 3. INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthFilter.value = monthStr;
    updateMonthLabel(monthStr);

    loadFromLocalStorage();
    renderAll();

    form.addEventListener('submit', handleFormSubmit);
    monthFilter.addEventListener('change', () => {
        updateMonthLabel(monthFilter.value);
        renderAll();
    });
    darkToggle.addEventListener('click', toggleDarkMode);
    document.getElementById('addQuickBtn').addEventListener('click', () => {
        document.querySelector('.form-box').scrollIntoView({ behavior: 'smooth' });
        descInput.focus();
    });

    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
        darkToggle.textContent = '☀️ Light';
    }
});

// ============================================================
// 4. TOAST SYSTEM (Replaces alert())
// ============================================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = '0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// 5. LOCAL STORAGE
// ============================================================
function saveToLocalStorage() {
    localStorage.setItem('financeData', JSON.stringify(transactions));
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('financeData');
    if (stored) {
        transactions = JSON.parse(stored);
        return;
    }

    // ---- SEED WITH SUPER REALISTIC DATA ----
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const prevM = String(today.getMonth()).padStart(2, '0') || '12';
    const prevY = today.getMonth() === 0 ? y - 1 : y;

    transactions = [
        { id: Date.now() + 1, description: 'Monthly Salary - Freelance', amount: 4850.00, category: 'Salary', type: 'income', date: `${y}-${m}-01` },
        { id: Date.now() + 2, description: 'Rent Payment', amount: 1200.00, category: 'Rent', type: 'expense', date: `${y}-${m}-02` },
        { id: Date.now() + 3, description: 'Electricity Bill', amount: 89.40, category: 'Bills & Utilities', type: 'expense', date: `${y}-${m}-03` },
        { id: Date.now() + 4, description: 'Morning Coffee & Pastry', amount: 12.75, category: 'Food & Dining', type: 'expense', date: `${y}-${m}-04` },
        { id: Date.now() + 5, description: 'Uber Ride to Airport', amount: 45.00, category: 'Transport', type: 'expense', date: `${y}-${m}-05` },
        { id: Date.now() + 6, description: 'Netflix Premium', amount: 19.99, category: 'Entertainment', type: 'expense', date: `${y}-${m}-06` },
        { id: Date.now() + 7, description: 'Grocery Run - Whole Foods', amount: 156.32, category: 'Food & Dining', type: 'expense', date: `${y}-${m}-07` },
        { id: Date.now() + 8, description: 'New Office Headphones', amount: 79.99, category: 'Shopping', type: 'expense', date: `${y}-${m}-08` },
        { id: Date.now() + 9, description: 'Dinner at Italian Bistro', amount: 64.20, category: 'Food & Dining', type: 'expense', date: `${y}-${m}-10` },
        { id: Date.now() + 10, description: 'Gym Membership', amount: 45.00, category: 'Other', type: 'expense', date: `${y}-${m}-12` },
        { id: Date.now() + 11, description: 'Water Bill', amount: 34.50, category: 'Bills & Utilities', type: 'expense', date: `${y}-${m}-15` },
        // Some previous month transactions to test filter
        { id: Date.now() + 12, description: 'Last Month Rent', amount: 1200.00, category: 'Rent', type: 'expense', date: `${prevY}-${prevM}-01` },
        { id: Date.now() + 13, description: 'Freelance Bonus', amount: 500.00, category: 'Salary', type: 'income', date: `${prevY}-${prevM}-25` },
    ];
    saveToLocalStorage();
}

// ============================================================
// 6. HELPERS
// ============================================================
function updateMonthLabel(monthVal) {
    if (!monthVal) return;
    const [year, month] = monthVal.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const label = `${months[parseInt(month) - 1]} ${year}`;
    currentMonthDisplay.textContent = `${label} Overview`;
    listMonthLabel.textContent = `Showing ${label}`;
}

function formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getFilteredTransactions() {
    const month = monthFilter.value;
    if (!month) return transactions;
    return transactions.filter(tx => tx.date && tx.date.startsWith(month));
}

// ============================================================
// 7. RENDER ALL
// ============================================================
function renderAll() {
    const filtered = getFilteredTransactions();

    // Summary
    let totalIncome = 0, totalExpense = 0;
    filtered.forEach(tx => {
        if (tx.type === 'income') totalIncome += tx.amount;
        else totalExpense += tx.amount;
    });
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

    incomeDisplay.textContent = formatCurrency(totalIncome);
    expenseDisplay.textContent = formatCurrency(totalExpense);
    balanceDisplay.textContent = formatCurrency(balance);
    savingsDisplay.textContent = savingsRate.toFixed(0) + '%';

    // Count & Top Category
    txCountBadge.textContent = `📋 ${filtered.length} Transactions`;
    const expenses = filtered.filter(tx => tx.type === 'expense');
    const catMap = {};
    expenses.forEach(tx => { catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount; });
    let topCat = 'None';
    let topVal = 0;
    for (const [cat, val] of Object.entries(catMap)) {
        if (val > topVal) { topVal = val; topCat = cat; }
    }
    topCategoryBadge.textContent = topCat !== 'None' ? `🏷️ Top: ${topCat}` : '🏷️ Top: None';

    renderChart(filtered);
    renderTransactionList(filtered);
}

// ============================================================
// 8. CHART (Elegant fixed color palette)
// ============================================================
function renderChart(filtered) {
    const expenses = filtered.filter(tx => tx.type === 'expense');
    const catMap = {};
    expenses.forEach(tx => { catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount; });

    const labels = Object.keys(catMap);
    const dataValues = Object.values(catMap);

    if (labels.length === 0) {
        chartEmptyMsg.style.display = 'block';
        if (myChart) { myChart.destroy(); myChart = null; }
        return;
    }
    chartEmptyMsg.style.display = 'none';

    // Professional muted palette
    const palette = ['#7c3aed', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
    const colors = labels.map((_, i) => palette[i % palette.length]);

    if (myChart) { myChart.destroy(); myChart = null; }

    const ctx = chartCanvas.getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: colors,
                borderColor: 'var(--bg-card)',
                borderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-secondary').trim() || '#64748b',
                        font: { size: 11, weight: '500' },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                    }
                }
            }
        }
    });
}

// ============================================================
// 9. TRANSACTION LIST
// ============================================================
function renderTransactionList(filtered) {
    if (filtered.length === 0) {
        transactionList.innerHTML = `<p class="empty-msg">No transactions for this month. Add one above!</p>`;
        return;
    }

    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

    let html = '';
    sorted.forEach(tx => {
        const sign = tx.type === 'income' ? '+' : '-';
        const colorClass = tx.type === 'income' ? 'income-text' : 'expense-text';
        const dateObj = new Date(tx.date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        html += `
            <div class="transaction-item" data-id="${tx.id}">
                <div class="tx-info">
                    <span class="tx-desc">${escapeHTML(tx.description)}</span>
                    <span class="tx-meta">
                        <span>${dateStr}</span>
                        <span class="tx-category">${escapeHTML(tx.category)}</span>
                    </span>
                </div>
                <span class="tx-amount ${colorClass}">${sign} ${formatCurrency(tx.amount)}</span>
                <div class="tx-actions">
                    <button class="edit-btn" onclick="editTransaction(${tx.id})">✏️</button>
                    <button class="delete-btn" onclick="deleteTransaction(${tx.id})">🗑️</button>
                </div>
            </div>
        `;
    });
    transactionList.innerHTML = html;
}

function escapeHTML(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

// ============================================================
// 10. CRUD: CREATE & UPDATE
// ============================================================
function handleFormSubmit(e) {
    e.preventDefault();

    const description = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    let type = 'expense';
    typeRadios.forEach(r => { if (r.checked) type = r.value; });

    if (!description) return showToast('Please enter a description.', 'error');
    if (isNaN(amount) || amount <= 0) return showToast('Please enter a valid positive amount.', 'error');

    const month = monthFilter.value;
    if (!month) return showToast('Please select a month.', 'error');

    if (editingId !== null) {
        const index = transactions.findIndex(tx => tx.id === editingId);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], description, amount, category, type, date: month + '-01' };
            showToast('✅ Transaction updated successfully!', 'success');
        }
        editingId = null;
        submitBtn.textContent = '➕ Add Transaction';
        formTitle.textContent = '➕ Add Transaction';
    } else {
        const newTx = { id: Date.now(), description, amount, category, type, date: month + '-01' };
        transactions.push(newTx);
        showToast('🎉 Transaction added!', 'success');
    }

    saveToLocalStorage();
    form.reset();
    document.querySelector('input[name="type"][value="income"]').checked = true;
    renderAll();
}

// ============================================================
// 11. CRUD: DELETE
// ============================================================
function deleteTransaction(id) {
    if (!confirm('Permanently delete this transaction?')) return;
    transactions = transactions.filter(tx => tx.id !== id);
    saveToLocalStorage();
    renderAll();
    showToast('🗑️ Transaction deleted.', 'info');
}

// ============================================================
// 12. CRUD: EDIT
// ============================================================
function editTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    descInput.value = tx.description;
    amountInput.value = tx.amount;
    categorySelect.value = tx.category;
    typeRadios.forEach(r => { r.checked = (r.value === tx.type); });

    editingId = tx.id;
    submitBtn.textContent = '✏️ Update Transaction';
    formTitle.textContent = '✏️ Edit Transaction';
    document.querySelector('.form-box').scrollIntoView({ behavior: 'smooth' });
    descInput.focus();
}

// ============================================================
// 13. DARK MODE TOGGLE (with chart refresh)
// ============================================================
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    darkToggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
    localStorage.setItem('darkMode', isDark);
    // Re-render chart to fix legend text color
    renderAll();
}
