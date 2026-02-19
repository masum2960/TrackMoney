const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const historyList = document.getElementById('history');
const clearButton = document.getElementById('clear');
const entryTemplate = document.getElementById('entry-template');

const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');

const STORAGE_KEY = 'trackmoney.entries';

/** @type {{id: string, description: string, amount: number, type: 'income' | 'expense', createdAt: string}[]} */
let entries = loadEntries();

function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return [];
  }

  return [];
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function updateSummary() {
  const income = entries
    .filter((entry) => entry.type === 'income')
    .reduce((total, entry) => total + entry.amount, 0);
  const expense = entries
    .filter((entry) => entry.type === 'expense')
    .reduce((total, entry) => total + entry.amount, 0);
  const balance = income - expense;

  incomeEl.textContent = formatCurrency(income);
  expenseEl.textContent = formatCurrency(expense);
  balanceEl.textContent = formatCurrency(balance);
}

function renderHistory() {
  historyList.innerHTML = '';

  if (entries.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No entries yet. Add your first one above.';
    historyList.appendChild(empty);
    return;
  }

  const ordered = [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  ordered.forEach((entry) => {
    const row = entryTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector('.entry-description').textContent = entry.description;
    row.querySelector('.entry-date').textContent = new Date(entry.createdAt).toLocaleString();

    const amountEl = row.querySelector('.entry-amount');
    amountEl.textContent = `${entry.type === 'expense' ? '-' : '+'}${formatCurrency(entry.amount)}`;
    amountEl.classList.add(entry.type);

    row.querySelector('.delete-btn').addEventListener('click', () => {
      entries = entries.filter((item) => item.id !== entry.id);
      saveEntries();
      renderHistory();
      updateSummary();
    });

    historyList.appendChild(row);
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number.parseFloat(amountInput.value);
  const type = typeInput.value;

  if (!description || Number.isNaN(amount) || amount <= 0) {
    return;
  }

  entries.push({
    id: crypto.randomUUID(),
    description,
    amount,
    type,
    createdAt: new Date().toISOString(),
  });

  saveEntries();
  renderHistory();
  updateSummary();
  form.reset();
  typeInput.value = 'income';
  descriptionInput.focus();
});

clearButton.addEventListener('click', () => {
  entries = [];
  saveEntries();
  renderHistory();
  updateSummary();
});

renderHistory();
updateSummary();
