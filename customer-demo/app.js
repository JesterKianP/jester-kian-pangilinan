(() => {
  'use strict';

  const STORAGE_KEY = 'northstar.customerRecords.v1';
  const ACTIVITY_KEY = 'northstar.customerActivity.v1';
  const WORKSPACES_KEY = 'northstar.workspaces.v1';
  const ACTIVE_WORKSPACE_KEY = 'northstar.activeWorkspace.v1';
  const ACCOUNTS_KEY = 'northstar.localAccounts.v1';
  const SESSION_KEY = 'northstar.localSession.v1';
  const ORDER = ['In progress', 'Completed', 'On hold'];
  const PAGE_SIZE = 8;
  const avatarTones = ['tone-lilac', 'tone-blue', 'tone-peach', 'tone-green', 'tone-rose', 'tone-sky'];
  const companyTones = ['tone-purple', 'tone-blue', 'tone-green', 'tone-amber', 'tone-rose'];
  const els = Object.fromEntries([
    'customerRows', 'recordCount', 'showingText', 'emptyState', 'searchInput', 'statusFilter', 'sortSelect', 'selectAll',
    'totalStat', 'totalContext', 'progressStat', 'completedStat', 'attentionStat', 'sidebarCount', 'modalBackdrop', 'modalTitle',
    'customerForm', 'recordId', 'nameField', 'emailField', 'phoneField', 'companyField', 'statusField', 'nameError', 'emailError',
    'duplicateWarning', 'duplicateMessage', 'saveBtn', 'toast', 'toastMessage', 'exportBtn', 'addCustomerBtn', 'emptyAddBtn',
    'closeModalBtn', 'cancelBtn'
  ].map(id => [id, document.getElementById(id)]));

  let workspaces = loadWorkspaces();
  let activeWorkspaceId = localStorage.getItem(ACTIVE_WORKSPACE_KEY) || workspaces[0].id;
  if (!workspaces.some(workspace => workspace.id === activeWorkspaceId)) activeWorkspaceId = workspaces[0].id;
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, activeWorkspaceId);
  migrateDefaultData();
  let customers = loadCustomers();
  let activity = loadActivity();
  let payments = loadPayments();
  let selectedIds = new Set();
  let currentPage = 1;
  let toastTimer;

  function loadWorkspaces() {
    try {
      const parsed = JSON.parse(localStorage.getItem(WORKSPACES_KEY) || 'null');
      if (Array.isArray(parsed) && parsed.length && parsed.every(item => item && typeof item.id === 'string' && typeof item.name === 'string')) return parsed;
    } catch {}
    const initial = [{ id: 'default', name: 'Northstar Studio' }];
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(initial));
    return initial;
  }

  function workspaceDataKey(type, id = activeWorkspaceId) { return `northstar.workspace.${id}.${type}`; }

  function migrateDefaultData() {
    if (!localStorage.getItem(workspaceDataKey('customers', 'default')) && localStorage.getItem(STORAGE_KEY)) localStorage.setItem(workspaceDataKey('customers', 'default'), localStorage.getItem(STORAGE_KEY));
    if (!localStorage.getItem(workspaceDataKey('activity', 'default')) && localStorage.getItem(ACTIVITY_KEY)) localStorage.setItem(workspaceDataKey('activity', 'default'), localStorage.getItem(ACTIVITY_KEY));
  }

  function switchWorkspace(id) {
    if (!workspaces.some(workspace => workspace.id === id) || id === activeWorkspaceId) return;
    activeWorkspaceId = id;
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    customers = loadCustomers();
    activity = loadActivity();
    payments = loadPayments();
    selectedIds.clear();
    updateWorkspaceUi();
    render();
    renderActivity();
    renderPayments();
    showToast(`Switched to ${workspaces.find(workspace => workspace.id === id).name}`);
  }

  function updateWorkspaceUi() {
    const select = document.getElementById('workspaceSelect');
    if (!select) return;
    select.innerHTML = workspaces.map(workspace => `<option value="${escapeHtml(workspace.id)}">${escapeHtml(workspace.name)}</option>`).join('') + '<option value="__manage__">＋ Manage workspaces…</option>';
    select.value = activeWorkspaceId;
    const selected = workspaces.find(workspace => workspace.id === activeWorkspaceId);
    document.getElementById('workspaceIcon').textContent = initials(selected.name).slice(0, 1);
    document.getElementById('workspaceCurrentName').textContent = selected.name;
    const nameField = document.getElementById('workspaceNameField');
    if (nameField) nameField.value = selected.name;
  }

  function loadCustomers() {
    try {
      const parsed = JSON.parse(localStorage.getItem(workspaceDataKey('customers')) || '[]');
      return Array.isArray(parsed) ? parsed.filter(isValidRecord) : [];
    } catch {
      return [];
    }
  }

  function loadActivity() {
    try {
      const parsed = JSON.parse(localStorage.getItem(workspaceDataKey('activity')) || '[]');
      return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.label === 'string' && Number.isFinite(item.at)).slice(0, 100) : [];
    } catch { return []; }
  }

  function loadPayments() {
    try {
      const parsed = JSON.parse(localStorage.getItem(workspaceDataKey('payments')) || '[]');
      return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === 'string' && typeof item.customerName === 'string' && Number.isFinite(item.amount)) : [];
    } catch { return []; }
  }

  function renderPayments() {
    const list = document.getElementById('paymentList');
    if (!list) return;
    const total = payments.filter(payment => payment.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0);
    document.getElementById('paymentCount').textContent = payments.length;
    document.getElementById('unpaidCount').textContent = payments.filter(payment => payment.status === 'unpaid').length;
    document.getElementById('processingCount').textContent = payments.filter(payment => payment.status === 'processing').length;
    document.getElementById('paymentTotal').textContent = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(total);
    const statusLabels = { unpaid: 'Unpaid', processing: 'Processing', paid: 'Paid (demo)' };
    list.innerHTML = payments.length ? payments.slice().sort((a, b) => b.createdAt - a.createdAt).map(payment => `<article class="payment-row"><span class="payment-icon">$</span><div class="payment-customer"><strong>${escapeHtml(payment.customerName)}</strong><small>${escapeHtml(payment.method)}${payment.note ? ` · ${escapeHtml(payment.note)}` : ''}</small></div><span class="payment-demo-status payment-status-${escapeHtml(payment.status || 'paid')}">${statusLabels[payment.status] || 'Paid (demo)'}</span><strong class="payment-amount">${new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(payment.amount)}</strong><time>${escapeHtml(new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(payment.createdAt))}</time></article>`).join('') : '<div class="activity-empty"><span class="empty-icon">$</span><strong>No payments recorded</strong><p>Use “Process payment” to add a simulated payment record.</p></div>';
  }

  function seedDemoPayments() {
    if (payments.length || !customers.some(customer => customer.id.startsWith('demo-'))) return;
    const samples = [
      { email: 'olivia@untitledui.com', amount: 480, status: 'unpaid', method: 'Invoice', note: 'Invoice #NS-1048' },
      { email: 'lana@command.com', amount: 1250, status: 'processing', method: 'Bank transfer', note: 'Transfer pending' },
      { email: 'phoenix@circooles.com', amount: 860, status: 'paid', method: 'Card (demo)', note: 'Sample payment' }
    ];
    for (const sample of samples) {
      const customer = customers.find(item => item.email.toLowerCase() === sample.email);
      if (!customer) continue;
      payments.push({ id: `demo-payment-${customer.id}`, customerId: customer.id, customerName: customer.name, amount: sample.amount, status: sample.status, method: sample.method, note: sample.note, createdAt: Date.now() - (sample.status === 'unpaid' ? 3600000 : sample.status === 'processing' ? 1800000 : 7200000), demo: true });
    }
    if (payments.length) localStorage.setItem(workspaceDataKey('payments'), JSON.stringify(payments));
  }

  function openPaymentModal() {
    const select = document.getElementById('paymentCustomer');
    select.innerHTML = customers.length ? customers.map(customer => `<option value="${escapeHtml(customer.id)}">${escapeHtml(customer.name)} · ${escapeHtml(customer.email)}</option>`).join('') : '<option value="">Add a customer first</option>';
    document.getElementById('paymentForm').reset();
    document.getElementById('paymentModalBackdrop').hidden = false;
    document.body.style.overflow = 'hidden';
    if (!customers.length) showToast('Add a customer before recording a payment');
  }

  function closePaymentModal() {
    document.getElementById('paymentModalBackdrop').hidden = true;
    document.body.style.overflow = '';
  }

  function savePaymentRecord(customer, amount, method, note, status = 'paid', processorId = '') {
    const payment = { id: crypto.randomUUID(), processorId, customerId: customer.id, customerName: customer.name, amount, status, method, note, createdAt: Date.now(), demo: true };
    payments.unshift(payment);
    localStorage.setItem(workspaceDataKey('payments'), JSON.stringify(payments));
    activity.unshift({ id: crypto.randomUUID(), action: 'Payment demo recorded', name: customer.name, email: customer.email, label: `Payment demo recorded for ${customer.name}`, at: Date.now() });
    activity = activity.slice(0, 100);
    localStorage.setItem(workspaceDataKey('activity'), JSON.stringify(activity));
    renderPayments();
    renderActivity();
  }

  function recordActivity(action, customer) {
    activity.unshift({ id: crypto.randomUUID(), action, name: customer.name, email: customer.email, label: `${action} ${customer.name}`, at: Date.now() });
    activity = activity.slice(0, 100);
    localStorage.setItem(workspaceDataKey('activity'), JSON.stringify(activity));
    renderActivity();
  }

  function renderActivity() {
    const list = document.getElementById('activityList');
    const total = document.getElementById('activityTotal');
    if (!list || !total) return;
    total.textContent = `${activity.length} ${activity.length === 1 ? 'update' : 'updates'}`;
    list.innerHTML = activity.length ? activity.map(item => `<article class="activity-item"><span class="activity-mark ${item.action === 'Deleted' ? 'activity-delete' : ''}">${item.action === 'Added' ? '+' : item.action === 'Deleted' ? '−' : '↻'}</span><div class="activity-copy"><strong>${escapeHtml(item.action === 'Payment demo recorded' ? item.action : `${item.action} customer`)}</strong><span>${escapeHtml(item.name)} <small>· ${escapeHtml(item.email)}</small></span></div><time datetime="${new Date(item.at).toISOString()}">${escapeHtml(new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(item.at))}</time></article>`).join('') : '<div class="activity-empty"><span class="empty-icon">✳</span><strong>No activity yet</strong><p>Changes to customer records will appear here.</p></div>';
  }

  function navigate(view) {
    const page = ['overview', 'customers', 'activity', 'payments', 'settings'].includes(view) ? view : 'overview';
    document.querySelectorAll('[data-nav]').forEach(link => link.classList.toggle('active', link.dataset.nav === page));
    document.getElementById('activity').hidden = page !== 'activity';
    document.getElementById('payments').hidden = page !== 'payments';
    document.getElementById('settings').hidden = page !== 'settings';
    document.getElementById('customers').hidden = page === 'activity' || page === 'overview' || page === 'payments';
    document.querySelector('.stats-grid').hidden = page === 'customers' || page === 'activity' || page === 'payments' || page === 'settings';
    document.querySelector('.page-heading').hidden = page === 'activity' || page === 'payments' || page === 'settings';
    document.querySelector('.breadcrumbs strong').textContent = page[0].toUpperCase() + page.slice(1);
    document.title = `Northstar — ${page === 'overview' ? 'Overview' : page === 'activity' ? 'Activity' : page === 'payments' ? 'Payments' : page === 'settings' ? 'Settings' : 'Customer records'}`;
    if (page === 'activity') renderActivity();
    if (page === 'payments') renderPayments();
    if (location.hash !== `#${page}`) location.hash = page;
  }

  function getAccounts() {
    try { const value = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  }

  function updateAccountUi() {
    const session = getSession();
    const status = document.getElementById('accountStatus');
    status.querySelector('strong').textContent = session ? `Logged in as ${session.name}` : 'Browsing as guest';
    status.querySelector('small').textContent = session ? session.email : 'Your customer records are saved in this browser.';
    document.getElementById('logoutBtn').hidden = !session;
    const initialsText = session ? initials(session.name) : 'JD';
    document.querySelector('.avatar-user').textContent = initialsText;
    document.querySelector('.avatar-small').textContent = initialsText;
    document.querySelector('.user-info strong').textContent = session?.name || 'Jamie Davis';
    document.querySelector('.user-info small').textContent = session ? 'Local account' : 'Administrator';
    const menu = document.getElementById('userMenu');
    const menuMarkup = `<button type="button" data-user-action="settings">Settings</button><button type="button" data-user-action="account">${session ? 'Account details' : 'Log in / create account'}</button><button type="button" data-user-action="workspace">Manage workspaces</button>${session ? '<button type="button" class="user-menu-logout" data-user-action="logout">Log out</button>' : ''}`;
    if (menu) menu.innerHTML = menuMarkup;
    const headerMenu = document.getElementById('headerUserMenu');
    if (headerMenu) headerMenu.innerHTML = menuMarkup;
  }

  async function passwordDigest(password, salt) {
    if (!globalThis.crypto?.subtle) throw new Error('Secure password support is unavailable. Open this app in a modern browser.');
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
    return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function isValidRecord(record) {
    return record && typeof record.id === 'string' && typeof record.name === 'string' &&
      typeof record.email === 'string' && ORDER.includes(record.status);
  }

  function persist() {
    localStorage.setItem(workspaceDataKey('customers'), JSON.stringify(customers));
    const indicator = document.querySelector('.sync-indicator');
    if (indicator) indicator.innerHTML = '<i></i> All changes saved';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function initials(name) {
    return String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || '?';
  }

  function hash(value) {
    return Array.from(String(value)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  }

  function filteredCustomers() {
    const query = els.searchInput.value.trim().toLowerCase();
    const status = els.statusFilter.value;
    const result = customers.filter(customer => {
      const matchesStatus = status === 'all' || customer.status === status;
      const searchable = [customer.name, customer.email, customer.phone, customer.company, customer.status].join(' ').toLowerCase();
      return matchesStatus && (!query || searchable.includes(query));
    });
    const sort = els.sortSelect.value;
    if (sort === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name-desc') result.sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === 'company') result.sort((a, b) => (a.company || '').localeCompare(b.company || '') || a.name.localeCompare(b.name));
    else if (sort === 'status') result.sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.name.localeCompare(b.name));
    else result.sort((a, b) => b.createdAt - a.createdAt);
    return result;
  }

  function render() {
    const matching = filteredCustomers();
    const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, pageCount);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const visible = matching.slice(pageStart, pageStart + PAGE_SIZE);
    els.recordCount.textContent = customers.length;
    els.sidebarCount.textContent = customers.length;
    els.totalStat.textContent = customers.length;
    els.totalContext.textContent = customers.length === 1 ? 'in your workspace' : 'in your workspace';
    els.progressStat.textContent = customers.filter(c => c.status === 'In progress').length;
    els.completedStat.textContent = customers.filter(c => c.status === 'Completed').length;
    els.attentionStat.textContent = customers.filter(c => c.status === 'On hold').length;
    els.showingText.textContent = matching.length
      ? `Showing ${pageStart + 1}–${pageStart + visible.length} of ${matching.length} ${matching.length === 1 ? 'customer' : 'customers'}`
      : 'Showing 0 customers';
    els.emptyState.hidden = visible.length !== 0;
    els.customerRows.innerHTML = visible.map(customer => {
      const avatarClass = avatarTones[hash(customer.email.toLowerCase()) % avatarTones.length];
      const companyClass = companyTones[hash(customer.company || customer.name) % companyTones.length];
      const statusClass = customer.status.toLowerCase().replaceAll(' ', '-');
      return `<tr data-row="${escapeHtml(customer.id)}">
        <td><input type="checkbox" class="row-check" data-select="${escapeHtml(customer.id)}" aria-label="Select ${escapeHtml(customer.name)}" ${selectedIds.has(customer.id) ? 'checked' : ''}></td>
        <td><div class="customer-cell"><span class="customer-avatar ${avatarClass}">${escapeHtml(initials(customer.name))}</span><div><div class="customer-name">${escapeHtml(customer.name)}</div><div class="customer-email">${escapeHtml(customer.email)}</div></div></div></td>
        <td><div class="company-cell"><span class="company-mark ${companyClass}">${escapeHtml((customer.company || '—').slice(0, 1).toUpperCase())}</span>${escapeHtml(customer.company || '—')}</div></td>
        <td>${escapeHtml(customer.phone || '—')}</td><td><span class="status-pill status-${statusClass}">${escapeHtml(customer.status)}</span></td><td class="email-cell">${escapeHtml(customer.email)}</td>
        <td class="row-actions"><button class="row-menu-btn" data-menu="${escapeHtml(customer.id)}" aria-label="Actions for ${escapeHtml(customer.name)}" aria-expanded="false">···</button></td>
      </tr>`;
    }).join('');
    els.selectAll.checked = visible.length > 0 && visible.every(record => selectedIds.has(record.id));
    els.selectAll.indeterminate = visible.some(record => selectedIds.has(record.id)) && !els.selectAll.checked;
    document.getElementById('pagination').innerHTML = pageCount > 1
      ? `<button class="page-button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button><span class="page-current" aria-current="page">${currentPage} / ${pageCount}</span><button class="page-button" data-page="${currentPage + 1}" ${currentPage === pageCount ? 'disabled' : ''} aria-label="Next page"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button>`
      : '';
  }

  function showToast(message) {
    els.toastMessage.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
  }

  function openModal(customer = null) {
    els.customerForm.reset();
    els.recordId.value = customer?.id || '';
    els.nameField.value = customer?.name || '';
    els.emailField.value = customer?.email || '';
    els.phoneField.value = customer?.phone || '';
    els.companyField.value = customer?.company || '';
    els.statusField.value = customer?.status || ORDER[0];
    els.modalTitle.textContent = customer ? 'Edit customer' : 'Add customer';
    els.saveBtn.textContent = customer ? 'Save changes' : 'Save customer';
    els.nameError.textContent = '';
    els.emailError.textContent = '';
    els.nameField.classList.remove('invalid');
    els.emailField.classList.remove('invalid');
    els.duplicateWarning.hidden = true;
    els.modalBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => els.nameField.focus());
  }

  function closeModal() {
    els.modalBackdrop.hidden = true;
    document.body.style.overflow = '';
  }

  function findDuplicate(email, currentId) {
    const normalized = email.trim().toLowerCase();
    return customers.find(customer => customer.id !== currentId && customer.email.trim().toLowerCase() === normalized);
  }

  function checkDuplicateLive() {
    const email = els.emailField.value.trim();
    const duplicate = email ? findDuplicate(email, els.recordId.value) : null;
    els.duplicateWarning.hidden = !duplicate;
    if (duplicate) els.duplicateMessage.textContent = `This email belongs to ${duplicate.name}. Use a unique email address.`;
    els.emailField.classList.toggle('invalid', Boolean(duplicate));
    els.emailError.textContent = duplicate ? 'Email address already exists.' : '';
  }

  function saveRecord(event) {
    event.preventDefault();
    const name = els.nameField.value.trim();
    const email = els.emailField.value.trim();
    const currentId = els.recordId.value;
    els.nameError.textContent = '';
    els.emailError.textContent = '';
    els.nameField.classList.remove('invalid');
    els.emailField.classList.remove('invalid');
    els.duplicateWarning.hidden = true;
    let valid = true;
    if (!name) {
      els.nameError.textContent = 'Please enter a name.';
      els.nameField.classList.add('invalid');
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      els.emailError.textContent = email ? 'Enter a valid email address.' : 'Please enter an email address.';
      els.emailField.classList.add('invalid');
      valid = false;
    } else {
      const duplicate = findDuplicate(email, currentId);
      if (duplicate) {
        els.duplicateWarning.hidden = false;
        els.duplicateMessage.textContent = `This email belongs to ${duplicate.name}. Use a unique email address.`;
        els.emailError.textContent = 'Email address already exists.';
        els.emailField.classList.add('invalid');
        valid = false;
      }
    }
    if (!valid) return;
    const existing = customers.find(customer => customer.id === currentId);
    const record = {
      id: existing?.id || crypto.randomUUID(), name, email, phone: els.phoneField.value.trim(),
      company: els.companyField.value.trim(), status: els.statusField.value,
      createdAt: existing?.createdAt || Date.now(), updatedAt: Date.now()
    };
    if (existing) customers = customers.map(customer => customer.id === currentId ? record : customer);
    else customers.unshift(record);
    persist();
    recordActivity(existing ? 'Updated' : 'Added', record);
    render();
    closeModal();
    showToast(existing ? 'Customer updated' : 'Customer added');
  }

  function openRowMenu(button) {
    const id = button.dataset.menu;
    const customer = customers.find(item => item.id === id);
    if (!customer) return;
    document.querySelectorAll('.row-menu').forEach(menu => menu.remove());
    document.querySelectorAll('.row-menu-btn').forEach(item => item.setAttribute('aria-expanded', 'false'));
    const menu = document.createElement('div');
    menu.className = 'row-menu';
    menu.innerHTML = '<button type="button" data-action="edit">Edit customer</button><button type="button" class="delete-action" data-action="delete">Delete customer</button>';
    button.setAttribute('aria-expanded', 'true');
    button.closest('td').append(menu);
    menu.addEventListener('click', event => {
      const action = event.target.closest('button')?.dataset.action;
      if (!action) return;
      menu.remove();
      if (action === 'edit') openModal(customer);
      if (action === 'delete') {
        customers = customers.filter(item => item.id !== id);
        selectedIds.delete(id);
        persist();
        recordActivity('Deleted', customer);
        render();
        showToast('Customer deleted');
      }
    });
  }

  function csvCell(value) {
    const safe = String(value ?? '');
    // Guard spreadsheet applications against interpreting user input as a formula.
    const protectedValue = /^[\s]*[=+@\-]/.test(safe) ? `'${safe}` : safe;
    return `"${protectedValue.replaceAll('"', '""')}"`;
  }

  function exportCsv() {
    const rows = selectedIds.size
      ? customers.filter(customer => selectedIds.has(customer.id))
      : filteredCustomers();
    if (!rows.length) {
      showToast('No customer records to export');
      return;
    }
    const header = ['Name', 'Email', 'Phone', 'Company', 'Order Status', 'Created At'];
    const lines = [header, ...rows.map(customer => [customer.name, customer.email, customer.phone, customer.company, customer.status, new Date(customer.createdAt).toISOString()])];
    const blob = new Blob(['\ufeff' + lines.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `northstar-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`Exported ${rows.length} ${rows.length === 1 ? 'record' : 'records'} to CSV`);
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (quoted && char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (!quoted && char === ',') { row.push(cell); cell = ''; }
      else if (!quoted && (char === '\n' || char === '\r')) {
        if (char === '\r' && text[index + 1] === '\n') index += 1;
        row.push(cell); cell = '';
        if (row.some(value => value.trim())) rows.push(row);
        row = [];
      } else cell += char;
    }
    if (quoted) throw new Error('The CSV has an unclosed quotation mark.');
    row.push(cell);
    if (row.some(value => value.trim())) rows.push(row);
    return rows;
  }

  async function importCsv(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('CSV must be smaller than 5 MB'); return; }
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error('Add a header row and at least one customer.');
      const normalize = value => value.trim().toLowerCase().replace(/[^a-z]/g, '');
      const headers = rows[0].map(normalize);
      const findColumn = (...names) => headers.findIndex(header => names.includes(header));
      const columns = {
        name: findColumn('name', 'fullname', 'customername'),
        email: findColumn('email', 'emailaddress', 'customeremail'),
        phone: findColumn('phone', 'phonenumber', 'telephone'),
        company: findColumn('company', 'organization', 'organisation'),
        status: findColumn('orderstatus', 'status')
      };
      if (columns.name < 0 || columns.email < 0) throw new Error('CSV needs Name and Email columns.');
      const knownEmails = new Set(customers.map(customer => customer.email.trim().toLowerCase()));
      const imported = [];
      let skipped = 0;
      const now = Date.now();
      for (const cells of rows.slice(1)) {
        const value = index => index < 0 ? '' : String(cells[index] || '').trim();
        const name = value(columns.name);
        const email = value(columns.email).toLowerCase();
        const rawStatus = value(columns.status).toLowerCase();
        const status = rawStatus ? ORDER.find(option => option.toLowerCase() === rawStatus) : ORDER[0];
        if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !status || knownEmails.has(email)) { skipped += 1; continue; }
        knownEmails.add(email);
        imported.push({ id: crypto.randomUUID(), name, email, phone: value(columns.phone), company: value(columns.company), status, createdAt: now + imported.length });
      }
      if (!imported.length) throw new Error(`No new valid records found (${skipped} skipped).`);
      customers = [...imported.reverse(), ...customers];
      currentPage = 1;
      selectedIds.clear();
      persist();
      recordActivity('Imported', { name: `${imported.length} customers`, email: file.name });
      render();
      showToast(`Imported ${imported.length} ${imported.length === 1 ? 'record' : 'records'}${skipped ? ` · skipped ${skipped}` : ''}`);
    } catch (error) {
      showToast(error.message || 'Could not read that CSV file');
    }
  }

  els.addCustomerBtn.addEventListener('click', () => openModal());
  document.getElementById('processPaymentBtn').addEventListener('click', openPaymentModal);
  document.getElementById('closePaymentModal').addEventListener('click', closePaymentModal);
  document.getElementById('cancelPaymentBtn').addEventListener('click', closePaymentModal);
  document.getElementById('paymentModalBackdrop').addEventListener('click', event => { if (event.target.id === 'paymentModalBackdrop') closePaymentModal(); });
  document.getElementById('paymentForm').addEventListener('submit', event => {
    event.preventDefault();
    const customer = customers.find(item => item.id === document.getElementById('paymentCustomer').value);
    const amount = Math.round(Number(document.getElementById('paymentAmount').value) * 100) / 100;
    if (!customer || !Number.isFinite(amount) || amount <= 0) {
      showToast(customer ? 'Enter a valid payment amount' : 'Add a customer before recording a payment');
      return;
    }
    const method = document.getElementById('paymentMethod').value;
    savePaymentRecord(customer, amount, method, document.getElementById('paymentNote').value.trim());
    closePaymentModal();
    showToast('Demo payment recorded; no charge was made');
  });
  document.getElementById('workspaceSelect').addEventListener('change', event => {
    if (event.target.value === '__manage__') {
      event.target.value = activeWorkspaceId;
      navigate('settings');
      return;
    }
    switchWorkspace(event.target.value);
  });
  document.getElementById('userMenuBtn').addEventListener('click', event => {
    const menu = document.getElementById('userMenu');
    menu.hidden = !menu.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.getElementById('headerUserMenuBtn').addEventListener('click', event => {
    const menu = document.getElementById('headerUserMenu');
    menu.hidden = !menu.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!menu.hidden));
  });
  function handleUserMenuAction(event) {
    const action = event.target.closest('[data-user-action]')?.dataset.userAction;
    if (!action) return;
    document.querySelectorAll('.user-menu').forEach(menu => { menu.hidden = true; });
    document.getElementById('userMenuBtn').setAttribute('aria-expanded', 'false');
    document.getElementById('headerUserMenuBtn').setAttribute('aria-expanded', 'false');
    if (action === 'settings' || action === 'workspace' || action === 'account') {
      navigate('settings');
      if (action === 'account' && !getSession()) document.getElementById('loginEmail').focus();
    }
    if (action === 'logout') {
      sessionStorage.removeItem(SESSION_KEY);
      updateAccountUi();
      showToast('Logged out');
    }
  }
  document.getElementById('userMenu').addEventListener('click', handleUserMenuAction);
  document.getElementById('headerUserMenu').addEventListener('click', handleUserMenuAction);
  document.getElementById('workspaceSettingsForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('workspaceNameField').value.trim();
    if (!name) return;
    workspaces = workspaces.map(workspace => workspace.id === activeWorkspaceId ? { ...workspace, name } : workspace);
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
    updateWorkspaceUi();
    document.getElementById('workspaceFeedback').textContent = 'Workspace name saved.';
    showToast('Workspace updated');
  });
  document.getElementById('createWorkspaceBtn').addEventListener('click', () => {
    const nameField = document.getElementById('newWorkspaceName');
    const name = nameField.value.trim();
    if (!name) { nameField.focus(); document.getElementById('workspaceFeedback').textContent = 'Enter a name for the new workspace.'; return; }
    const workspace = { id: crypto.randomUUID(), name: name.slice(0, 60) };
    workspaces.push(workspace);
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
    nameField.value = '';
    updateWorkspaceUi();
    switchWorkspace(workspace.id);
    document.getElementById('workspaceFeedback').textContent = 'Workspace created with an empty customer list.';
  });
  document.querySelectorAll('[data-nav]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    navigate(link.dataset.nav);
  }));
  window.addEventListener('hashchange', () => navigate(location.hash.slice(1)));
  document.getElementById('createAccountForm').addEventListener('submit', async event => {
    event.preventDefault();
    const name = document.getElementById('accountName').value.trim();
    const email = document.getElementById('accountEmail').value.trim().toLowerCase();
    const password = document.getElementById('accountPassword').value;
    const feedback = document.getElementById('createFeedback');
    feedback.textContent = '';
    const accounts = getAccounts();
    if (accounts.some(account => account.email === email)) { feedback.textContent = 'An account with this email already exists on this device.'; return; }
    if (password.length < 8) { feedback.textContent = 'Use at least 8 characters for your password.'; return; }
    try {
      const salt = crypto.randomUUID();
      accounts.push({ name, email, salt, passwordHash: await passwordDigest(password, salt), createdAt: Date.now() });
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name, email }));
      event.target.reset();
      feedback.textContent = 'Account created. You are now logged in on this browser.';
      updateAccountUi();
      showToast('Local account created');
    } catch (error) { feedback.textContent = error.message || 'Could not create account.'; }
  });
  document.getElementById('loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const feedback = document.getElementById('loginFeedback');
    feedback.textContent = '';
    const account = getAccounts().find(item => item.email === email);
    try {
      if (!account || await passwordDigest(password, account.salt) !== account.passwordHash) { feedback.textContent = 'Email or password did not match a local account.'; return; }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name: account.name, email: account.email }));
      event.target.reset();
      feedback.textContent = 'You are logged in on this browser.';
      updateAccountUi();
      showToast('Logged in');
    } catch (error) { feedback.textContent = error.message || 'Could not log in.'; }
  });
  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    updateAccountUi();
    showToast('Logged out');
  });
  els.emptyAddBtn.addEventListener('click', () => openModal());
  els.closeModalBtn.addEventListener('click', closeModal);
  els.cancelBtn.addEventListener('click', closeModal);
  els.modalBackdrop.addEventListener('click', event => { if (event.target === els.modalBackdrop) closeModal(); });
  els.customerForm.addEventListener('submit', saveRecord);
  els.emailField.addEventListener('input', checkDuplicateLive);
  els.searchInput.addEventListener('input', () => { currentPage = 1; render(); });
  els.statusFilter.addEventListener('change', () => { currentPage = 1; render(); });
  els.sortSelect.addEventListener('change', () => { currentPage = 1; render(); });
  els.exportBtn.addEventListener('click', exportCsv);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', event => {
    importCsv(event.target.files[0]);
    event.target.value = '';
  });
  document.getElementById('pagination').addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page);
    render();
  });
  els.customerRows.addEventListener('click', event => {
    const menuButton = event.target.closest('[data-menu]');
    if (menuButton) openRowMenu(menuButton);
  });
  els.customerRows.addEventListener('change', event => {
    const checkbox = event.target.closest('[data-select]');
    if (!checkbox) return;
    if (checkbox.checked) selectedIds.add(checkbox.dataset.select);
    else selectedIds.delete(checkbox.dataset.select);
    render();
  });
  els.selectAll.addEventListener('change', () => {
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    filteredCustomers().slice(pageStart, pageStart + PAGE_SIZE).forEach(customer => els.selectAll.checked ? selectedIds.add(customer.id) : selectedIds.delete(customer.id));
    render();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.user-profile')) {
      document.getElementById('userMenu').hidden = true;
      document.getElementById('userMenuBtn').setAttribute('aria-expanded', 'false');
    }
    if (!event.target.closest('.header-profile-menu')) {
      document.getElementById('headerUserMenu').hidden = true;
      document.getElementById('headerUserMenuBtn').setAttribute('aria-expanded', 'false');
    }
    if (!event.target.closest('.row-actions')) {
      document.querySelectorAll('.row-menu').forEach(menu => menu.remove());
      document.querySelectorAll('.row-menu-btn').forEach(button => button.setAttribute('aria-expanded', 'false'));
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !els.modalBackdrop.hidden) closeModal();
    if (event.key === 'Escape' && !document.getElementById('paymentModalBackdrop').hidden) closePaymentModal();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      els.searchInput.focus();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      openModal();
    }
  });

  render();
  updateWorkspaceUi();
  seedDemoPayments();
  renderPayments();
  updateAccountUi();
  navigate(location.hash.slice(1));
})();
