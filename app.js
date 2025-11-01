/***** SELECTORS – tweak these to match your HTML *****/
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const els = {
  userList: $('#user-list'),               // <ul id="user-list">
  stockList: $('#stock-list'),             // <ul id="stock-list">
  portfolioBody: $('#portfolio-body'),     // <tbody id="portfolio-body">
  stockDetails: $('#stock-details'),       // <div id="stock-details">
  userForm: $('#user-form'),               // <form id="user-form">
  nameInput: $('#user-name'),              // <input id="user-name">
  emailInput: $('#user-email'),            // <input id="user-email">
  phoneInput: $('#user-phone'),            // <input id="user-phone">
  saveBtn: $('#save-user'),                // <button id="save-user">
  deleteBtn: $('#delete-user'),            // <button id="delete-user">
  activeUserHeader: $('#active-user')      // <span id="active-user">
};

/***** SIMPLE IN-MEMORY STATE (sample data for testing) *****/
const state = {
  users: [
    {
      id: 'u1',
      name: 'Alice Morgan',
      email: 'alice@example.com',
      phone: '555-0101',
      portfolio: [
        { ticker: 'AAPL', shares: 12, basis: 120.00 },
        { ticker: 'MSFT', shares: 8,  basis: 190.00 },
        { ticker: 'TSLA', shares: 5,  basis: 220.00 }
      ]
    },
    {
      id: 'u2',
      name: 'Ben Ortiz',
      email: 'ben@example.com',
      phone: '555-0202',
      portfolio: [
        { ticker: 'AMZN', shares: 3,  basis: 100.00 },
        { ticker: 'NVDA', shares: 6,  basis: 300.00 }
      ]
    }
  ],
  stocks: {
    AAPL: { name: 'Apple Inc.',       sector: 'Technology', price: 170.25 },
    MSFT: { name: 'Microsoft Corp.',  sector: 'Technology', price: 415.10 },
    TSLA: { name: 'Tesla, Inc.',      sector: 'Automotive', price: 205.75 },
    AMZN: { name: 'Amazon.com, Inc.', sector: 'Consumer',   price: 182.40 },
    NVDA: { name: 'NVIDIA Corp.',     sector: 'Technology', price: 905.30 }
  },
  activeUserId: null,
  activeTicker: null
};

/***** RENDER HELPERS *****/
function renderUserList() {
  els.userList.innerHTML = state.users
    .map(u => `<li data-userid="${u.id}" class="user-item${u.id===state.activeUserId?' active':''}">
                 <span>${u.name}</span>
               </li>`)
    .join('');
}

function renderStockList(user) {
  // all unique tickers for the selected user
  const tickers = [...new Set(user.portfolio.map(p => p.ticker))];
  els.stockList.innerHTML = tickers
    .map(t => `<li data-ticker="${t}" class="stock-item${t===state.activeTicker?' active':''}">
                 <span>${t}</span>
               </li>`)
    .join('');
}

function renderPortfolio(user) {
  els.portfolioBody.innerHTML = user.portfolio.map(p => {
    const price = state.stocks[p.ticker]?.price ?? 0;
    const mktValue = price * p.shares;
    const gain = (price - p.basis) * p.shares;
    return `<tr data-ticker="${p.ticker}">
              <td>${p.ticker}</td>
              <td>${p.shares}</td>
              <td>$${p.basis.toFixed(2)}</td>
              <td>$${price.toFixed(2)}</td>
              <td>$${mktValue.toFixed(2)}</td>
              <td class="${gain>=0?'pos':'neg'}">$${gain.toFixed(2)}</td>
            </tr>`;
  }).join('');
}

function renderStockDetails(ticker) {
  if (!ticker) { els.stockDetails.innerHTML = '<p>Select a stock…</p>'; return; }
  const s = state.stocks[ticker];
  if (!s) { els.stockDetails.innerHTML = `<p>No data for ${ticker}</p>`; return; }
  els.stockDetails.innerHTML = `
    <h3>${ticker} — ${s.name}</h3>
    <ul class="kv">
      <li><strong>Sector:</strong> ${s.sector}</li>
      <li><strong>Price:</strong> $${s.price.toFixed(2)}</li>
    </ul>`;
}

function renderUserForm(user) {
  els.nameInput.value = user.name;
  els.emailInput.value = user.email;
  els.phoneInput.value = user.phone;
  if (els.activeUserHeader) els.activeUserHeader.textContent = user.name;
}

/***** CONTROLLER ACTIONS *****/
function selectUser(userId) {
  state.activeUserId = userId;
  const user = state.users.find(u => u.id === userId);
  if (!user) return;

  renderUserList();
  renderUserForm(user);
  renderPortfolio(user);
  renderStockList(user);

  // default active ticker = first in portfolio
  state.activeTicker = user.portfolio[0]?.ticker ?? null;
  renderStockDetails(state.activeTicker);
}

function selectStock(ticker) {
  state.activeTicker = ticker;
  // update active class in stock list
  $$('.stock-item', els.stockList).forEach(li => {
    li.classList.toggle('active', li.dataset.ticker === ticker);
  });
  renderStockDetails(ticker);
}

function saveActiveUser(e) {
  e.preventDefault();
  const user = state.users.find(u => u.id === state.activeUserId);
  if (!user) return;

  user.name = els.nameInput.value.trim();
  user.email = els.emailInput.value.trim();
  user.phone = els.phoneInput.value.trim();

  renderUserList();
  renderUserForm(user);
}

function deleteActiveUser() {
  if (!state.activeUserId) return;
  const i = state.users.findIndex(u => u.id === state.activeUserId);
  if (i === -1) return;
  state.users.splice(i, 1);

  // clear panels
  els.portfolioBody.innerHTML = '';
  els.stockList.innerHTML = '';
  els.stockDetails.innerHTML = '<p>No user selected.</p>';
  els.userForm.reset();
  if (els.activeUserHeader) els.activeUserHeader.textContent = '';

  state.activeUserId = null;
  state.activeTicker = null;

  renderUserList();
}

/***** EVENT WIRING *****/
// user clicks on a user in the list
els.userList?.addEventListener('click', (e) => {
  const li = e.target.closest('[data-userid]');
  if (!li) return;
  selectUser(li.dataset.userid);
});

// user clicks on a stock in the list OR a portfolio row
els.stockList?.addEventListener('click', (e) => {
  const li = e.target.closest('[data-ticker]');
  if (!li) return;
  selectStock(li.dataset.ticker);
});

els.portfolioBody?.addEventListener('click', (e) => {
  const row = e.target.closest('tr[data-ticker]');
  if (!row) return;
  selectStock(row.dataset.ticker);
});

// save / delete
els.userForm?.addEventListener('submit', saveActiveUser);
els.saveBtn?.addEventListener('click', saveActiveUser);
els.deleteBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  deleteActiveUser();
});

/***** INITIALIZE *****/
function init() {
  renderUserList();
  // auto-select first user for convenience
  if (state.users.length) selectUser(state.users[0].id);
  else {
    els.stockDetails.innerHTML = '<p>No user selected.</p>';
  }
}
document.addEventListener('DOMContentLoaded', init);
