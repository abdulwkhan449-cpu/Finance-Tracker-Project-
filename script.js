// ============================================================
// 1. STATE MANAGEMENT
//    Our main array that holds all transaction objects.
//    Each object: { id, description, amount, category, type, date }
// ============================================================
let transactions = [];
let editingId = null; // If not null, we are in "Edit" mode
let myChart = null;   // Holds the Chart.js instance

// ============================================================
// 2. DOM REFERENCES (Grabbing HTML elements)
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
const transactionList = document.getElementById('transactionList');
const monthFilter = document.getElementById('monthFilter');
const darkToggle = document.getElementById('darkModeToggle');
const chartCanvas = document.getElementById('expenseChart');
const chartEmptyMsg = document.getElementById('chartEmptyMsg');

// ============================================================
// 3. INITIALIZATION (Runs when page loads)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Set default month filter to current month (YYYY-MM)
    const now = new Date();
    monthFilter.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Load saved data from Local Storage
    loadFromLocalStorage();

    // Render everything
    renderAll();

    // Set up event listeners
    form.addEventListener('submit', handleFormSubmit);
    monthFilter.addEventListener('change', renderAll);
    darkToggle.addEventListener('click', toggleDarkMode);

    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
        darkToggle.textContent = '☀️ Light Mode';
    }
});

// ============================================================
// 4. LOCAL STORAGE (Save & Load)
// ============================================================
function saveToLocalStorage() {
    localStorage.setItem('financeData', JSON.stringify(transactions));
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('financeData');
    if (stored) {
        transactions = JSON.parse(stored);
    } else {
        // If no data, seed with 5 sample transactions for demo
        transactions = [
            { id: Date.now() + 1, description: 'Salary', amount: 3000, category: 'Salary', type: 'income', date: '2026-07-01' },
            { id: Date.now() + 2, description: 'Groceries', amount: 150, category: 'Food', type: 'expense', date: '2026-07-03' },
            { id: Date.now() + 3, description: 'Netflix', amount: 15.99, category: 'Entertainment', type: 'expense', date: '2026-07-05' },
            { id: Date.now() + 4, description: 'Uber Ride', amount: 25, category: 'Transport', type: 'expense', date: '2026-06-28' },
            { id: Date.now() + 5, description: 'New Shoes', amount: 80, category: 'Shopping', type: 'expense', date: '2026-06-25' },
        ];
        saveToLocalStorage();
    }
}

// ============================================================
// 5. DARK MODE
// ============================================================
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    darkToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem('darkMode', isDark);
}

// ============================================================
// 6. HELPER: Get filtered transactions for the selected month
// ============================================================
function getFilteredTransactions() {
    const month = monthFilter.value; // format: "2026-07"
    if (!month) return transactions;
    return transactions.filter(tx => tx.date && tx.date.startsWith(month));
}

// ============================================================
// 7. RENDER: Summary, Chart, and List
// ============================================================
function renderAll() {
    const filtered = getFilteredTransactions();

    // 7a. Update Summary Cards
    let totalIncome = 0;
    let totalExpense = 0;
    filtered.forEach(tx => {
        if (tx.type === 'income') totalIncome += tx.amount;
        else totalExpense += tx.amount;
    });
    const balance = totalIncome - totalExpense;

    incomeDisplay.textContent = `$${totalIncome.toFixed(2)}`;
    expenseDisplay.textContent = `$${totalExpense.toFixed(2)}`;
    balanceDisplay.textContent = `$${balance.toFixed(2)}`;

    // 7b. Update Chart (only for expenses)
    renderChart(filtered);

    // 7c. Update Transaction List
    renderTransactionList(filtered);
}

// ============================================================
// 8. RENDER: Chart (Expense Breakdown by Category)
// ============================================================
function renderChart(filtered) {
    // Filter only expenses
    const expenses = filtered.filter(tx => tx.type === 'expense');

    // Group by category and sum amounts
    const categoryMap = {};
    expenses.forEach(tx => {
        categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
    });

    const labels = Object.keys(categoryMap);
    const dataValues = Object.values(categoryMap);

    // Show/hide empty message
    if (labels.length === 0) {
        chartEmptyMsg.style.display = 'block';
        if (myChart) {
            myChart.destroy();
            myChart = null;
        }
        return;
    } else {
        chartEmptyMsg.style.display = 'none';
    }

    // Generate random colors for each category
    const colors = labels.map(() => {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 60%)`;
    });

    // If chart already exists, destroy it before creating a new one
    if (myChart) {
        myChart.destroy();
        myChart = null;
    }

    // Create new chart
    const ctx = chartCanvas.getContext('2d');
    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary').trim(),
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

// ============================================================
// 9. RENDER: Transaction List
// ============================================================
function renderTransactionList(filtered) {
    if (filtered.length === 0) {
        transactionList.innerHTML = `<p class="empty-msg">No transactions for this month.</p>`;
        return;
    }

    // Sort by date (newest first) and then by id
    const sorted = [...filtered].sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.id - a.id;
    });

    let html = '';
    sorted.forEach(tx => {
        const sign = tx.type === 'income' ? '+' : '-';
        const colorClass = tx.type === 'income' ? 'income-text' : 'expense-text';
        const date = tx.date ? tx.date.replace('-', '/') : 'No date';

        html += `
            <div class="transaction-item" data-id="${tx.id}">
                <div class="tx-info">
                    <span class="tx-desc">${escapeHTML(tx.description)}</span>
                    <span class="tx-category">${escapeHTML(tx.category)} • ${date}</span>
                </div>
                <span class="tx-amount ${colorClass}">${sign}$${tx.amount.toFixed(2)}</span>
                <div class="tx-actions">
                    <button class="edit-btn" onclick="editTransaction(${tx.id})">✏️ Edit</button>
                    <button class="delete-btn" onclick="deleteTransaction(${tx.id})">🗑️ Delete</button>
                </div>
            </div>
        `;
    });

    transactionList.innerHTML = html;
}

// Simple security: prevent XSS from user input
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// 10. CRUD: CREATE (Add) & UPDATE (Edit)
// ============================================================
function handleFormSubmit(e) {
    e.preventDefault();

    // Get values
    const description = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    let type = 'expense';
    typeRadios.forEach(radio => {
        if (radio.checked) type = radio.value;
    });

    // Validation
    if (!description) return alert('Please enter a description.');
    if (isNaN(amount) || amount <= 0) return alert('Please enter a valid positive amount.');

    // Get current month for the date
    const month = monthFilter.value; // e.g., "2026-07"
    if (!month) return alert('Please select a month.');

    if (editingId !== null) {
        // ---- UPDATE (Edit) Mode ----
        const index = transactions.findIndex(tx => tx.id === editingId);
        if (index !== -1) {
            transactions[index] = {
                ...transactions[index],
                description,
                amount,
                category,
                type,
                date: month + '-01' // Store as YYYY-MM-01 for filtering
            };
        }
        // Reset editing state
        editingId = null;
        submitBtn.textContent = '➕ Add Transaction';
        formTitle.textContent = '➕ Add Transaction';
    } else {
        // ---- CREATE (Add) Mode ----
        const newTx = {
            id: Date.now(),
            description,
            amount,
            category,
            type,
            date: month + '-01'
        };
        transactions.push(newTx);
    }

    // Save, reset form, and re-render
    saveToLocalStorage();
    form.reset();
    // Set default radio to income
    document.querySelector('input[name="type"][value="income"]').checked = true;
    renderAll();
}

// ============================================================
// 11. CRUD: DELETE
// ============================================================
function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    transactions = transactions.filter(tx => tx.id !== id);
    saveToLocalStorage();
    renderAll();
}

// ============================================================
// 12. CRUD: EDIT (Load data into the form)
// ============================================================
function editTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Populate the form with the transaction data
    descInput.value = tx.description;
    amountInput.value = tx.amount;
    categorySelect.value = tx.category;
    typeRadios.forEach(radio => {
        radio.checked = (radio.value === tx.type);
    });

    // Change the button and title to "Update" mode
    editingId = tx.id;
    submitBtn.textContent = '✏️ Update Transaction';
    formTitle.textContent = '✏️ Edit Transaction';

    // Scroll to the form
    form.scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// 13. BONUS: When theme changes, update chart colors dynamically
// ============================================================
// We listen to dark mode toggle to refresh the chart colors.
// Since we destroy/recreate chart on every render, it auto-updates.
// But we need to re-render when theme changes.
const originalToggle = toggleDarkMode;
toggleDarkMode = function() {
    originalToggle();
    // Re-render the chart to match new text color
    renderAll();
};
// Override the button click to use our new function
darkToggle.removeEventListener('click', toggleDarkMode);
darkToggle.addEventListener('click', toggleDarkMode);
