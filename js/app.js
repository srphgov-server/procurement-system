// Main Application Controller
const AppState = {
  lang: localStorage.getItem('procureflow_lang') || 'en',
  role: localStorage.getItem('procureflow_role') || 'admin',
  currentTab: 'dashboard',
  filters: {
    search: '',
    department: 'all',
    status: 'all',
    priority: 'all'
  },
  activeModal: null,
  viewingReqId: null,
  editingCategoryId: null,
  editingItemId: null,
  editingUserId: null
};

// Helper translation function
function t(key) {
  if (i18n[AppState.lang] && i18n[AppState.lang][key]) {
    return i18n[AppState.lang][key];
  }
  if (i18n.en && i18n.en[key]) {
    return i18n.en[key];
  }
  return key;
}

// Format Currency
function formatCurrency(val) {
  const num = Number(val) || 0;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Show Toast Notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initLanguageSwitcher();
  initRoleSwitcher();
  initNavigation();
  initKPIListeners();
  initFilterListeners();
  initRequestForm();
  renderAll();
});

// Setup Language Switcher
function initLanguageSwitcher() {
  const enBtn = document.getElementById('langEnBtn');
  const khBtn = document.getElementById('langKhBtn');
  if (enBtn && khBtn) {
    enBtn.addEventListener('click', () => setLanguage('en'));
    khBtn.addEventListener('click', () => setLanguage('kh'));
  }
}

function setLanguage(lang) {
  AppState.lang = lang;
  localStorage.setItem('procureflow_lang', lang);
  updateLanguageUI();
  renderAll();
}

function updateLanguageUI() {
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById(AppState.lang === 'kh' ? 'langKhBtn' : 'langEnBtn');
  if (activeBtn) activeBtn.classList.add('active');

  // Update static text with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    el.setAttribute('placeholder', t(key));
  });

  // Update role badge description tooltip
  const roleDescEl = document.getElementById('roleDescriptionText');
  if (roleDescEl) {
    if (AppState.role === 'admin') roleDescEl.textContent = t('roleNoteAdmin');
    else if (AppState.role === 'management') roleDescEl.textContent = t('roleNoteManagement');
    else roleDescEl.textContent = t('roleNoteRequester');
  }
}

// Setup Role Switcher
function initRoleSwitcher() {
  const select = document.getElementById('roleSelector');
  if (select) {
    select.value = AppState.role;
    select.addEventListener('change', (e) => {
      AppState.role = e.target.value;
      localStorage.setItem('procureflow_role', AppState.role);
      updateLanguageUI();
      renderAll();
      showToast(`${t('currentRole')}: ${getRoleName(AppState.role)}`, 'info');
    });
  }
}

function getRoleName(role) {
  if (role === 'admin') return t('roleAdmin');
  if (role === 'management') return t('roleManagement');
  return t('roleRequester');
}

// Navigation Tabs
function initNavigation() {
  document.querySelectorAll('[data-nav-target]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-nav-target');
      switchTab(target);
    });
  });

  // Reset sample data button
  const resetBtn = document.getElementById('navResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm(t('confirmDelete') + '\n(' + t('navReset') + ')')) {
        AppData.resetAllToDefault();
        renderAll();
        showToast(t('dataResetSuccess'), 'success');
      }
    });
  }

  // Export Data button
  const exportBtn = document.getElementById('navExportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      exportRequisitionsToCSV();
    });
  }
}

function switchTab(tab) {
  AppState.currentTab = tab;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = document.querySelector(`[data-nav-target="${tab}"]`);
  if (activeNav) activeNav.classList.add('active');

  // Toggle view visibility
  document.querySelectorAll('.tab-view').forEach(view => {
    view.style.display = view.id === `view-${tab}` ? 'block' : 'none';
  });

  // If opening request form, refresh catalog options and reset line items
  if (tab === 'new-request') {
    populateDepartmentSelect();
    resetLineItemsTable();
  }

  renderCurrentTabView();
}

function renderAll() {
  updateLanguageUI();
  updateRoleVisibility();
  populateFilterDropdowns();
  renderKPIs();
  renderPriorityPills();
  renderCurrentTabView();
}

function updateRoleVisibility() {
  // If role is Requester, hide List Management or show readonly note
  const masterNavs = document.querySelectorAll('.admin-only-nav');
  masterNavs.forEach(nav => {
    if (AppState.role === 'admin') {
      nav.style.display = 'flex';
    } else {
      nav.style.display = 'none';
    }
  });

  // If requester is somehow in admin tab, fallback to dashboard
  if (AppState.role !== 'admin' && ['categories', 'items', 'users'].includes(AppState.currentTab)) {
    switchTab('dashboard');
  }
}

function renderCurrentTabView() {
  switch (AppState.currentTab) {
    case 'dashboard':
      renderRequisitionsTable();
      break;
    case 'categories':
      renderCategoriesTable();
      break;
    case 'items':
      renderItemsTable();
      break;
    case 'users':
      renderUsersTable();
      break;
  }
}

// KPI Box Metrics & Interactions
function renderKPIs() {
  const requisitions = AppData.getRequisitions();
  const totalCount = requisitions.length;
  const newPendingCount = requisitions.filter(r => r.status === 'new' || r.status === 'under_review').length;
  const urgentHighCount = requisitions.filter(r => r.priority === 'urgent' || r.priority === 'high').length;
  const approvedCount = requisitions.filter(r => r.status === 'approved' || r.status === 'completed').length;
  const totalBudget = requisitions.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);

  document.getElementById('kpiTotalValue').textContent = totalCount;
  document.getElementById('kpiNewValue').textContent = newPendingCount;
  document.getElementById('kpiUrgentValue').textContent = urgentHighCount;
  document.getElementById('kpiApprovedValue').textContent = approvedCount;
  document.getElementById('kpiBudgetValue').textContent = formatCurrency(totalBudget);
}

function initKPIListeners() {
  const kpiTotal = document.getElementById('kpiTotalCard');
  const kpiNew = document.getElementById('kpiNewCard');
  const kpiUrgent = document.getElementById('kpiUrgentCard');
  const kpiApproved = document.getElementById('kpiApprovedCard');

  if (kpiTotal) {
    kpiTotal.addEventListener('click', () => {
      AppState.filters.status = 'all';
      AppState.filters.priority = 'all';
      document.getElementById('filterStatusSelect').value = 'all';
      document.getElementById('filterPrioritySelect').value = 'all';
      renderRequisitionsTable();
    });
  }

  if (kpiNew) {
    kpiNew.addEventListener('click', () => {
      AppState.filters.status = 'new';
      document.getElementById('filterStatusSelect').value = 'new';
      renderRequisitionsTable();
    });
  }

  if (kpiUrgent) {
    kpiUrgent.addEventListener('click', () => {
      AppState.filters.priority = 'urgent';
      document.getElementById('filterPrioritySelect').value = 'urgent';
      renderRequisitionsTable();
    });
  }

  if (kpiApproved) {
    kpiApproved.addEventListener('click', () => {
      AppState.filters.status = 'approved';
      document.getElementById('filterStatusSelect').value = 'approved';
      renderRequisitionsTable();
    });
  }
}

// Priority Breakdown Bar
function renderPriorityPills() {
  const requisitions = AppData.getRequisitions();
  const counts = {
    urgent: requisitions.filter(r => r.priority === 'urgent').length,
    high: requisitions.filter(r => r.priority === 'high').length,
    medium: requisitions.filter(r => r.priority === 'medium').length,
    low: requisitions.filter(r => r.priority === 'low').length
  };

  const container = document.getElementById('priorityPillsContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="priority-pill ${AppState.filters.priority === 'all' ? 'active' : ''}" onclick="setPriorityFilter('all')">
      <span>${t('priorityAll')} (${requisitions.length})</span>
    </div>
    <div class="priority-pill urgent ${AppState.filters.priority === 'urgent' ? 'active' : ''}" onclick="setPriorityFilter('urgent')">
      <span class="pulse-dot"></span>
      <span>${t('priorityUrgent')}: ${counts.urgent}</span>
    </div>
    <div class="priority-pill high ${AppState.filters.priority === 'high' ? 'active' : ''}" onclick="setPriorityFilter('high')">
      <span>${t('priorityHigh')}: ${counts.high}</span>
    </div>
    <div class="priority-pill medium ${AppState.filters.priority === 'medium' ? 'active' : ''}" onclick="setPriorityFilter('medium')">
      <span>${t('priorityMedium')}: ${counts.medium}</span>
    </div>
    <div class="priority-pill low ${AppState.filters.priority === 'low' ? 'active' : ''}" onclick="setPriorityFilter('low')">
      <span>${t('priorityLow')}: ${counts.low}</span>
    </div>
  `;
}

window.setPriorityFilter = function(priority) {
  AppState.filters.priority = priority;
  const select = document.getElementById('filterPrioritySelect');
  if (select) select.value = priority;
  renderPriorityPills();
  renderRequisitionsTable();
};

// Filter Bar Handlers
function initFilterListeners() {
  const searchInput = document.getElementById('tableSearchInput');
  const deptSelect = document.getElementById('filterDepartmentSelect');
  const statusSelect = document.getElementById('filterStatusSelect');
  const prioritySelect = document.getElementById('filterPrioritySelect');
  const clearBtn = document.getElementById('clearFiltersBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.filters.search = e.target.value.toLowerCase().trim();
      renderRequisitionsTable();
    });
  }

  if (deptSelect) {
    deptSelect.addEventListener('change', (e) => {
      AppState.filters.department = e.target.value;
      renderRequisitionsTable();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      AppState.filters.status = e.target.value;
      renderRequisitionsTable();
    });
  }

  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      AppState.filters.priority = e.target.value;
      renderPriorityPills();
      renderRequisitionsTable();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      AppState.filters = { search: '', department: 'all', status: 'all', priority: 'all' };
      if (searchInput) searchInput.value = '';
      if (deptSelect) deptSelect.value = 'all';
      if (statusSelect) statusSelect.value = 'all';
      if (prioritySelect) prioritySelect.value = 'all';
      renderPriorityPills();
      renderRequisitionsTable();
    });
  }
}

function populateFilterDropdowns() {
  const deptSelect = document.getElementById('filterDepartmentSelect');
  if (!deptSelect) return;
  const currentVal = deptSelect.value || 'all';
  const depts = AppData.getDepartments();

  let html = `<option value="all">${t('allDepartments')}</option>`;
  depts.forEach(d => {
    const name = AppState.lang === 'kh' ? d.nameKh : d.nameEn;
    html += `<option value="${d.id}">${name}</option>`;
  });
  deptSelect.innerHTML = html;
  deptSelect.value = currentVal;
}

// Render Requisitions Table
function renderRequisitionsTable() {
  const tbody = document.getElementById('requisitionsTableBody');
  if (!tbody) return;

  let list = AppData.getRequisitions();

  // Management filter highlight: if management role, show alert banner or prioritize new requests
  const mgmtBanner = document.getElementById('managementNoticeBanner');
  if (mgmtBanner) {
    if (AppState.role === 'management') {
      const newCount = list.filter(r => r.status === 'new').length;
      mgmtBanner.style.display = 'flex';
      mgmtBanner.innerHTML = `
        <div style="font-weight:600;">👔 ${t('roleManagement')}:</div>
        <div>${AppState.lang === 'kh' ? `មានសំណើថ្មីចំនួន <strong>${newCount}</strong> កំពុងរង់ចាំការពិនិត្យពីលោកអ្នក` : `There are <strong>${newCount}</strong> new requests awaiting management review`}</div>
        <button class="btn btn-sm btn-outline" onclick="filterOnlyNew()">${AppState.lang === 'kh' ? 'មើលតែសំណើថ្មី' : 'Show New Only'}</button>
      `;
    } else {
      mgmtBanner.style.display = 'none';
    }
  }

  // Apply filters
  if (AppState.filters.department !== 'all') {
    list = list.filter(r => r.department === AppState.filters.department);
  }
  if (AppState.filters.status !== 'all') {
    list = list.filter(r => r.status === AppState.filters.status);
  }
  if (AppState.filters.priority !== 'all') {
    list = list.filter(r => r.priority === AppState.filters.priority);
  }
  if (AppState.filters.search) {
    const term = AppState.filters.search;
    list = list.filter(r => 
      r.id.toLowerCase().includes(term) ||
      r.requesterName.toLowerCase().includes(term) ||
      r.department.toLowerCase().includes(term) ||
      (r.purpose && r.purpose.toLowerCase().includes(term)) ||
      (r.items && r.items.some(i => i.itemName.toLowerCase().includes(term)))
    );
  }

  // Update counts indicator
  const countEl = document.getElementById('tableResultsCount');
  if (countEl) {
    countEl.textContent = `${t('showingResults')} ${list.length} ${t('ofResults')} ${AppData.getRequisitions().length}`;
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 24px; margin-bottom: 8px;">📋</div>
          <div>${t('noRecordsFound')}</div>
        </td>
      </tr>
    `;
    return;
  }

  // Render rows
  tbody.innerHTML = list.map(req => {
    const priorityBadge = getPriorityBadge(req.priority);
    const statusBadge = getStatusBadge(req.status);
    const deptObj = AppData.getDepartments().find(d => d.id === req.department);
    const deptName = deptObj ? (AppState.lang === 'kh' ? deptObj.nameKh : deptObj.nameEn) : req.department;
    const itemsCount = req.items ? req.items.length : 0;
    const firstItem = req.items && req.items[0] ? req.items[0].itemName : '-';
    const itemsPreview = itemsCount > 1 ? `${firstItem} (+${itemsCount - 1} more)` : firstItem;

    // Action button depends on role and status
    let actionBtnHtml = '';
    if (AppState.role === 'admin') {
      actionBtnHtml = `
        <button class="btn btn-sm btn-primary" onclick="openRequisitionDetail('${req.id}')">${t('actionReview')}</button>
      `;
    } else if (AppState.role === 'management') {
      actionBtnHtml = `
        <button class="btn btn-sm btn-primary" onclick="openRequisitionDetail('${req.id}')">${req.status === 'new' ? t('actionReview') : t('actionView')}</button>
      `;
    } else {
      actionBtnHtml = `
        <button class="btn btn-sm btn-outline" onclick="openRequisitionDetail('${req.id}')">${t('actionView')}</button>
      `;
    }

    return `
      <tr>
        <td><strong style="color:var(--primary); font-family: monospace;">${req.id}</strong></td>
        <td>
          <div style="font-weight:600;">${req.requestDate}</div>
          <div style="font-size:11.5px; color:var(--text-light);">${AppState.lang === 'kh' ? 'ត្រូវការ៖ ' : 'Need: '}${req.neededDate || '-'}</div>
        </td>
        <td><span class="badge" style="background:#f1f5f9; color:#334155;">${deptName}</span></td>
        <td>
          <div style="font-weight:600;">${req.requesterName}</div>
          <div style="font-size:11px; color:var(--text-light);">${req.requesterEmail || ''}</div>
        </td>
        <td style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${firstItem}">
          ${itemsPreview}
        </td>
        <td><strong>${formatCurrency(req.totalAmount)}</strong></td>
        <td>${priorityBadge}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex; gap:6px;">
            ${actionBtnHtml}
            <button class="btn btn-sm btn-outline" onclick="printRequisition('${req.id}')" title="${t('actionPrint')}">🖨️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.filterOnlyNew = function() {
  AppState.filters.status = 'new';
  const sel = document.getElementById('filterStatusSelect');
  if (sel) sel.value = 'new';
  renderRequisitionsTable();
};

function getPriorityBadge(priority) {
  switch (priority) {
    case 'urgent':
      return `<span class="badge badge-priority-urgent"><span class="pulse-dot"></span>${t('priorityUrgent')}</span>`;
    case 'high':
      return `<span class="badge badge-priority-high">${t('priorityHigh')}</span>`;
    case 'medium':
      return `<span class="badge badge-priority-medium">${t('priorityMedium')}</span>`;
    case 'low':
      return `<span class="badge badge-priority-low">${t('priorityLow')}</span>`;
    default:
      return `<span class="badge">${priority}</span>`;
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'new':
      return `<span class="badge badge-status-new">● ${t('statusNew')}</span>`;
    case 'under_review':
      return `<span class="badge badge-status-under_review">⏳ ${t('statusUnderReview')}</span>`;
    case 'approved':
      return `<span class="badge badge-status-approved">✓ ${t('statusApproved')}</span>`;
    case 'rejected':
      return `<span class="badge badge-status-rejected">✕ ${t('statusRejected')}</span>`;
    case 'completed':
      return `<span class="badge badge-status-completed">★ ${t('statusCompleted')}</span>`;
    default:
      return `<span class="badge">${status}</span>`;
  }
}

// Request Form Handlers
function initRequestForm() {
  const form = document.getElementById('newRequisitionForm');
  const addLineBtn = document.getElementById('addNewLineBtn');
  const cancelBtn = document.getElementById('cancelRequestBtn');

  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('formRequestDate');
  if (dateInput) dateInput.value = today;

  if (addLineBtn) {
    addLineBtn.addEventListener('click', () => {
      addLineItemRow();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      switchTab('dashboard');
    });
  }

  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
}

function populateDepartmentSelect() {
  const deptSelect = document.getElementById('formDepartmentSelect');
  if (!deptSelect) return;
  const depts = AppData.getDepartments();
  deptSelect.innerHTML = `<option value="">-- ${t('deptSelectPlaceholder')} --</option>` +
    depts.map(d => `<option value="${d.id}">${AppState.lang === 'kh' ? d.nameKh : d.nameEn}</option>`).join('');
}

let lineItemCounter = 0;
function resetLineItemsTable() {
  const tbody = document.getElementById('lineItemsTbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  lineItemCounter = 0;
  // Add 1 default row
  addLineItemRow();
  updateGrandTotal();
}

function addLineItemRow(data = null) {
  const tbody = document.getElementById('lineItemsTbody');
  if (!tbody) return;
  lineItemCounter++;
  const rowId = `row-${lineItemCounter}`;
  const catalogItems = AppData.getItems().filter(i => i.status === 'active');
  const categories = AppData.getCategories();

  let itemOptionsHtml = `<option value="">-- ${t('colItemSelect')} --</option>`;
  catalogItems.forEach(item => {
    const itemName = AppState.lang === 'kh' ? item.nameKh : item.nameEn;
    itemOptionsHtml += `<option value="${item.id}" data-cat="${item.categoryId}" data-unit="${item.unit}" data-price="${item.estimatedPrice}">${item.code} - ${itemName} ($${item.estimatedPrice})</option>`;
  });
  itemOptionsHtml += `<option value="custom">${t('customItemOption')}</option>`;

  let catOptionsHtml = '';
  categories.forEach(cat => {
    const catName = AppState.lang === 'kh' ? cat.nameKh : cat.nameEn;
    catOptionsHtml += `<option value="${cat.id}">${catName}</option>`;
  });

  const tr = document.createElement('tr');
  tr.id = rowId;
  tr.innerHTML = `
    <td>
      <select class="form-select item-catalog-select" onchange="onCatalogItemSelected('${rowId}', this.value)">
        ${itemOptionsHtml}
      </select>
      <input type="text" class="form-input item-custom-name" placeholder="Custom item name..." style="display:none; margin-top:4px;" />
    </td>
    <td>
      <select class="form-select item-category-select">
        ${catOptionsHtml}
      </select>
    </td>
    <td>
      <input type="text" class="form-input item-spec" placeholder="Specs, brand, model..." />
    </td>
    <td style="width: 90px;">
      <input type="number" min="1" value="1" class="form-input item-qty" oninput="calculateRowSubtotal('${rowId}')" />
    </td>
    <td style="width: 100px;">
      <input type="text" value="Pcs" class="form-input item-unit" />
    </td>
    <td style="width: 120px;">
      <input type="number" step="0.01" min="0" value="0.00" class="form-input item-price" oninput="calculateRowSubtotal('${rowId}')" />
    </td>
    <td style="width: 120px; font-weight:700; text-align:right;">
      <span class="item-subtotal">$0.00</span>
    </td>
    <td style="width: 50px; text-align:center;">
      <button type="button" class="btn btn-sm btn-text" onclick="removeLineItemRow('${rowId}')" title="${t('actionDelete')}">🗑️</button>
    </td>
  `;

  tbody.appendChild(tr);
  calculateRowSubtotal(rowId);
}

window.onCatalogItemSelected = function(rowId, itemId) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const customInput = row.querySelector('.item-custom-name');
  const catSelect = row.querySelector('.item-category-select');
  const unitInput = row.querySelector('.item-unit');
  const priceInput = row.querySelector('.item-price');

  if (itemId === 'custom') {
    customInput.style.display = 'block';
    customInput.required = true;
    priceInput.value = '0.00';
  } else if (itemId) {
    customInput.style.display = 'none';
    customInput.required = false;
    const item = AppData.getItems().find(i => i.id === itemId);
    if (item) {
      catSelect.value = item.categoryId;
      unitInput.value = item.unit;
      priceInput.value = item.estimatedPrice.toFixed(2);
    }
  } else {
    customInput.style.display = 'none';
  }
  calculateRowSubtotal(rowId);
};

window.calculateRowSubtotal = function(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
  const price = parseFloat(row.querySelector('.item-price').value) || 0;
  const subtotal = qty * price;
  row.querySelector('.item-subtotal').textContent = formatCurrency(subtotal);
  row.setAttribute('data-subtotal', subtotal.toFixed(2));
  updateGrandTotal();
};

window.removeLineItemRow = function(rowId) {
  const tbody = document.getElementById('lineItemsTbody');
  if (tbody.children.length <= 1) {
    showToast(t('emptyItemsError'), 'danger');
    return;
  }
  const row = document.getElementById(rowId);
  if (row) row.remove();
  updateGrandTotal();
};

function updateGrandTotal() {
  const rows = document.querySelectorAll('#lineItemsTbody tr');
  let total = 0;
  rows.forEach(r => {
    total += parseFloat(r.getAttribute('data-subtotal')) || 0;
  });
  const el = document.getElementById('formGrandTotalDisplay');
  if (el) el.textContent = formatCurrency(total);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const dept = document.getElementById('formDepartmentSelect').value;
  const requesterName = document.getElementById('formRequesterName').value.trim();
  const requesterEmail = document.getElementById('formRequesterEmail').value.trim();
  const requestDate = document.getElementById('formRequestDate').value;
  const neededDate = document.getElementById('formNeededDate').value;
  const priority = document.getElementById('formPrioritySelect').value;
  const purpose = document.getElementById('formPurposeText').value.trim();

  // Validate items
  const rows = document.querySelectorAll('#lineItemsTbody tr');
  const items = [];
  rows.forEach(row => {
    const catalogSelect = row.querySelector('.item-catalog-select');
    const customInput = row.querySelector('.item-custom-name');
    const catSelect = row.querySelector('.item-category-select');
    const spec = row.querySelector('.item-spec').value.trim();
    const qty = parseFloat(row.querySelector('.item-qty').value) || 1;
    const unit = row.querySelector('.item-unit').value.trim();
    const unitPrice = parseFloat(row.querySelector('.item-price').value) || 0;
    const subtotal = qty * unitPrice;

    let itemName = '';
    let itemId = '';
    if (catalogSelect.value === 'custom') {
      itemName = customInput.value.trim() || 'Custom Item';
      itemId = 'custom-' + Date.now();
    } else if (catalogSelect.value) {
      const itm = AppData.getItems().find(i => i.id === catalogSelect.value);
      itemName = itm ? (AppState.lang === 'kh' ? itm.nameKh : itm.nameEn) : 'Item';
      itemId = catalogSelect.value;
    }

    if (itemName) {
      items.push({
        itemId,
        itemName,
        categoryId: catSelect.value,
        spec,
        qty,
        unit,
        unitPrice,
        subtotal
      });
    }
  });

  if (items.length === 0) {
    showToast(t('emptyItemsError'), 'danger');
    return;
  }

  const requisitions = AppData.getRequisitions();
  const nextNumber = requisitions.length + 1;
  const newId = `REQ-2026-${String(nextNumber).padStart(3, '0')}`;
  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

  const newRequisition = {
    id: newId,
    requestDate: requestDate || new Date().toISOString().split('T')[0],
    neededDate: neededDate || '',
    department: dept,
    requesterName,
    requesterEmail,
    priority,
    purpose,
    items,
    totalAmount,
    status: 'new',
    remarks: 'Submitted for management review.',
    history: [
      {
        action: 'Created',
        byRole: 'requester',
        byUser: requesterName,
        timestamp: new Date().toLocaleString(),
        comment: `Submitted by ${dept} Department`
      }
    ]
  };

  requisitions.unshift(newRequisition);
  AppData.saveRequisitions(requisitions);

  showToast(`${t('reqSubmittedSuccess')} ${newId}`, 'success');
  switchTab('dashboard');
  renderAll();
}

// Requisition Detail Modal & Workflow Actions
window.openRequisitionDetail = function(reqId) {
  AppState.viewingReqId = reqId;
  const req = AppData.getRequisitions().find(r => r.id === reqId);
  if (!req) return;

  const modal = document.getElementById('requisitionDetailModal');
  const container = document.getElementById('requisitionDetailContent');
  if (!modal || !container) return;

  const deptObj = AppData.getDepartments().find(d => d.id === req.department);
  const deptName = deptObj ? (AppState.lang === 'kh' ? deptObj.nameKh : deptObj.nameEn) : req.department;

  // Build items table
  const itemsHtml = req.items.map((item, idx) => {
    const cat = AppData.getCategories().find(c => c.id === item.categoryId);
    const catName = cat ? (AppState.lang === 'kh' ? cat.nameKh : cat.nameEn) : item.categoryId;
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <div style="font-weight:700;">${item.itemName}</div>
          <div style="font-size:12px; color:var(--text-light);">${item.spec || '-'}</div>
        </td>
        <td><span class="badge" style="background:#f1f5f9;">${catName}</span></td>
        <td>${item.qty} ${item.unit}</td>
        <td>${formatCurrency(item.unitPrice)}</td>
        <td style="text-align:right; font-weight:700;">${formatCurrency(item.subtotal)}</td>
      </tr>
    `;
  }).join('');

  // Build history timeline
  const historyHtml = (req.history || []).map(h => {
    return `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-meta">
          <strong>${h.action}</strong> by <span style="color:var(--primary);">${h.byUser}</span> (${getRoleName(h.byRole)})
          <span style="font-size:11px; color:var(--text-light); margin-left:8px;">${h.timestamp}</span>
        </div>
        <div class="timeline-comment">${h.comment || ''}</div>
      </div>
    `;
  }).join('');

  // Workflow Action Panel based on Current Role
  let actionPanelHtml = '';
  if (AppState.role === 'admin' || AppState.role === 'management') {
    let actionButtons = '';
    
    if (AppState.role === 'management') {
      actionButtons = `
        <button class="btn btn-primary" onclick="updateReqStatus('${req.id}', 'under_review')">${t('btnConfirmReview')}</button>
      `;
    } else if (AppState.role === 'admin') {
      actionButtons = `
        <button class="btn btn-warning" onclick="updateReqStatus('${req.id}', 'under_review')">${t('btnConfirmReview')}</button>
        <button class="btn btn-success" onclick="updateReqStatus('${req.id}', 'approved')">${t('btnConfirmApprove')}</button>
        <button class="btn btn-danger" onclick="updateReqStatus('${req.id}', 'rejected')">${t('btnConfirmReject')}</button>
        <button class="btn btn-outline" onclick="updateReqStatus('${req.id}', 'completed')">${t('btnConfirmComplete')}</button>
      `;
    }

    actionPanelHtml = `
      <div class="action-panel-box">
        <h4>⚡ ${t('sectionManagementActions')} (${getRoleName(AppState.role)})</h4>
        <div class="form-group" style="margin-bottom:12px;">
          <label>${t('reviewCommentsLabel')}</label>
          <input type="text" id="actionRemarkInput" class="form-input" placeholder="${t('reviewCommentsPlaceholder')}" value="${req.remarks || ''}" />
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          ${actionButtons}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <!-- Print-only header -->
    <div class="print-only-header">
      <h2>PROCUREMENT REQUISITION ORDER</h2>
      <p>Company Procurement Department | Official Purchase Request Voucher</p>
      <hr style="margin: 15px 0;" />
    </div>

    <!-- General Info Grid -->
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; background:#f8fafc; padding:16px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:20px;">
      <div>
        <div style="font-size:12px; color:var(--text-muted);">${t('thReqId')}</div>
        <div style="font-size:18px; font-weight:800; color:var(--primary); font-family:monospace;">${req.id}</div>
      </div>
      <div>
        <div style="font-size:12px; color:var(--text-muted);">${t('thStatus')}</div>
        <div>${getStatusBadge(req.status)}</div>
      </div>
      <div>
        <div style="font-size:12px; color:var(--text-muted);">${t('thPriority')}</div>
        <div>${getPriorityBadge(req.priority)}</div>
      </div>
      <div>
        <div style="font-size:12px; color:var(--text-muted);">${t('thDepartment')}</div>
        <div style="font-weight:700;">${deptName}</div>
      </div>
      <div>
        <div style="font-size:12px; color:var(--text-muted);">${t('thRequester')}</div>
        <div style="font-weight:700;">${req.requesterName} <span style="font-size:11px; color:var(--text-light); font-weight:normal;">(${req.requesterEmail || ''})</span></div>
      </div>
      <div>
        <div style="font-size:12px; color:var(--text-muted);">${t('requestDateLabel')} / ${t('neededDateLabel')}</div>
        <div style="font-weight:600;">${req.requestDate} ➔ <span style="color:var(--danger);">${req.neededDate || '-'}</span></div>
      </div>
    </div>

    <!-- Purpose -->
    <div style="margin-bottom:20px;">
      <h4 style="font-size:14px; font-weight:700; margin-bottom:6px;">${t('purposeLabel')}:</h4>
      <div style="background:#ffffff; border:1px solid var(--border-color); padding:12px 14px; border-radius:6px; color:var(--text-main);">
        ${req.purpose || 'No justification provided.'}
      </div>
    </div>

    <!-- Items Table -->
    <div style="margin-bottom:20px;">
      <h4 style="font-size:14px; font-weight:700; margin-bottom:8px;">${t('sectionItemsList')}</h4>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:40px;">#</th>
              <th>${t('colItemSelect')}</th>
              <th>${t('colCategory')}</th>
              <th>${t('colQty')} & ${t('colUnit')}</th>
              <th>${t('colUnitPrice')}</th>
              <th style="text-align:right;">${t('colLineTotal')}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr style="background:#f8fafc; font-weight:800; font-size:15px;">
              <td colspan="5" style="text-align:right;">${t('grandTotal')}</td>
              <td style="text-align:right; color:var(--primary);">${formatCurrency(req.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Workflow Audit Timeline -->
    <div style="margin-bottom:20px;">
      <h4 style="font-size:14px; font-weight:700; margin-bottom:6px;">${t('sectionWorkflow')}</h4>
      <div class="timeline">
        ${historyHtml}
      </div>
    </div>

    <!-- Action Panel for Management/Admin -->
    ${actionPanelHtml}
  `;

  modal.classList.add('open');
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
};

window.updateReqStatus = function(reqId, newStatus) {
  const remarkInput = document.getElementById('actionRemarkInput');
  const comment = remarkInput ? remarkInput.value.trim() : '';

  const requisitions = AppData.getRequisitions();
  const req = requisitions.find(r => r.id === reqId);
  if (!req) return;

  req.status = newStatus;
  req.remarks = comment || `Status updated to ${newStatus}`;
  
  if (!req.history) req.history = [];
  const actionLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
  req.history.push({
    action: actionLabel,
    byRole: AppState.role,
    byUser: AppState.role === 'admin' ? 'Administrator' : 'Management Reviewer',
    timestamp: new Date().toLocaleString(),
    comment: comment || `Status changed to ${newStatus}`
  });

  AppData.saveRequisitions(requisitions);
  showToast(t('statusUpdatedSuccess'), 'success');
  closeModal('requisitionDetailModal');
  renderAll();
};

window.printRequisition = function(reqId) {
  openRequisitionDetail(reqId);
  setTimeout(() => {
    window.print();
  }, 300);
};

// Master Data: Categories
function renderCategoriesTable() {
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;
  const categories = AppData.getCategories();
  const items = AppData.getItems();

  tbody.innerHTML = categories.map(cat => {
    const itemCount = items.filter(i => i.categoryId === cat.id).length;
    const statusPill = cat.status === 'active'
      ? `<span class="badge" style="background:#ecfdf5; color:#047857;">${t('active')}</span>`
      : `<span class="badge" style="background:#fef2f2; color:#b91c1c;">${t('inactive')}</span>`;

    return `
      <tr>
        <td><strong>${cat.code}</strong></td>
        <td>${cat.nameEn}</td>
        <td>${cat.nameKh}</td>
        <td>${cat.desc || '-'}</td>
        <td><span class="badge" style="background:#f1f5f9;">${itemCount} items</span></td>
        <td>${statusPill}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="openEditCategoryModal('${cat.id}')">${t('actionEdit')}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory('${cat.id}')">${t('actionDelete')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAddCategoryModal = function() {
  AppState.editingCategoryId = null;
  document.getElementById('catModalTitle').textContent = t('modalAddCatTitle');
  document.getElementById('catFormCode').value = '';
  document.getElementById('catFormNameEn').value = '';
  document.getElementById('catFormNameKh').value = '';
  document.getElementById('catFormDesc').value = '';
  document.getElementById('catFormStatus').value = 'active';
  document.getElementById('categoryModal').classList.add('open');
};

window.openEditCategoryModal = function(catId) {
  AppState.editingCategoryId = catId;
  const cat = AppData.getCategories().find(c => c.id === catId);
  if (!cat) return;

  document.getElementById('catModalTitle').textContent = t('modalEditCatTitle');
  document.getElementById('catFormCode').value = cat.code;
  document.getElementById('catFormNameEn').value = cat.nameEn;
  document.getElementById('catFormNameKh').value = cat.nameKh;
  document.getElementById('catFormDesc').value = cat.desc || '';
  document.getElementById('catFormStatus').value = cat.status || 'active';
  document.getElementById('categoryModal').classList.add('open');
};

window.saveCategory = function() {
  const code = document.getElementById('catFormCode').value.trim();
  const nameEn = document.getElementById('catFormNameEn').value.trim();
  const nameKh = document.getElementById('catFormNameKh').value.trim();
  const desc = document.getElementById('catFormDesc').value.trim();
  const status = document.getElementById('catFormStatus').value;

  if (!code || !nameEn) {
    showToast('Code and English Name are required', 'danger');
    return;
  }

  const categories = AppData.getCategories();
  if (AppState.editingCategoryId) {
    const target = categories.find(c => c.id === AppState.editingCategoryId);
    if (target) {
      target.code = code;
      target.nameEn = nameEn;
      target.nameKh = nameKh || nameEn;
      target.desc = desc;
      target.status = status;
    }
  } else {
    categories.push({
      id: 'CAT-' + String(categories.length + 1).padStart(3, '0'),
      code,
      nameEn,
      nameKh: nameKh || nameEn,
      desc,
      status
    });
  }

  AppData.saveCategories(categories);
  showToast(t('itemSavedSuccess'), 'success');
  closeModal('categoryModal');
  renderCategoriesTable();
};

window.deleteCategory = function(catId) {
  if (!confirm(t('confirmDelete'))) return;
  let categories = AppData.getCategories();
  categories = categories.filter(c => c.id !== catId);
  AppData.saveCategories(categories);
  showToast(t('statusUpdatedSuccess'), 'success');
  renderCategoriesTable();
};

// Master Data: Items
function renderItemsTable() {
  const tbody = document.getElementById('itemsTableBody');
  if (!tbody) return;
  const items = AppData.getItems();
  const categories = AppData.getCategories();

  tbody.innerHTML = items.map(item => {
    const cat = categories.find(c => c.id === item.categoryId);
    const catName = cat ? (AppState.lang === 'kh' ? cat.nameKh : cat.nameEn) : item.categoryId;
    const statusPill = item.status === 'active'
      ? `<span class="badge" style="background:#ecfdf5; color:#047857;">${t('active')}</span>`
      : `<span class="badge" style="background:#fef2f2; color:#b91c1c;">${t('inactive')}</span>`;

    return `
      <tr>
        <td><strong>${item.code}</strong></td>
        <td>${item.nameEn}</td>
        <td>${item.nameKh}</td>
        <td><span class="badge" style="background:#f1f5f9;">${catName}</span></td>
        <td>${item.unit}</td>
        <td><strong>${formatCurrency(item.estimatedPrice)}</strong></td>
        <td>${statusPill}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="openEditItemModal('${item.id}')">${t('actionEdit')}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteItem('${item.id}')">${t('actionDelete')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAddItemModal = function() {
  AppState.editingItemId = null;
  document.getElementById('itemModalTitle').textContent = t('modalAddItemTitle');
  document.getElementById('itemFormCode').value = '';
  document.getElementById('itemFormNameEn').value = '';
  document.getElementById('itemFormNameKh').value = '';
  document.getElementById('itemFormUnit').value = 'Unit';
  document.getElementById('itemFormPrice').value = '0.00';
  document.getElementById('itemFormStatus').value = 'active';

  populateItemCategoryDropdown();
  document.getElementById('itemModal').classList.add('open');
};

function populateItemCategoryDropdown(selectedVal = '') {
  const sel = document.getElementById('itemFormCategory');
  if (!sel) return;
  const categories = AppData.getCategories();
  sel.innerHTML = categories.map(c => `
    <option value="${c.id}" ${c.id === selectedVal ? 'selected' : ''}>
      ${AppState.lang === 'kh' ? c.nameKh : c.nameEn}
    </option>
  `).join('');
}

window.openEditItemModal = function(itemId) {
  AppState.editingItemId = itemId;
  const item = AppData.getItems().find(i => i.id === itemId);
  if (!item) return;

  document.getElementById('itemModalTitle').textContent = t('modalEditItemTitle');
  document.getElementById('itemFormCode').value = item.code;
  document.getElementById('itemFormNameEn').value = item.nameEn;
  document.getElementById('itemFormNameKh').value = item.nameKh;
  document.getElementById('itemFormUnit').value = item.unit;
  document.getElementById('itemFormPrice').value = item.estimatedPrice;
  document.getElementById('itemFormStatus').value = item.status;

  populateItemCategoryDropdown(item.categoryId);
  document.getElementById('itemModal').classList.add('open');
};

window.saveItem = function() {
  const code = document.getElementById('itemFormCode').value.trim();
  const nameEn = document.getElementById('itemFormNameEn').value.trim();
  const nameKh = document.getElementById('itemFormNameKh').value.trim();
  const categoryId = document.getElementById('itemFormCategory').value;
  const unit = document.getElementById('itemFormUnit').value.trim();
  const estimatedPrice = parseFloat(document.getElementById('itemFormPrice').value) || 0;
  const status = document.getElementById('itemFormStatus').value;

  if (!code || !nameEn) {
    showToast('Code and Name are required', 'danger');
    return;
  }

  const items = AppData.getItems();
  if (AppState.editingItemId) {
    const target = items.find(i => i.id === AppState.editingItemId);
    if (target) {
      target.code = code;
      target.nameEn = nameEn;
      target.nameKh = nameKh || nameEn;
      target.categoryId = categoryId;
      target.unit = unit;
      target.estimatedPrice = estimatedPrice;
      target.status = status;
    }
  } else {
    items.push({
      id: 'ITM-' + String(items.length + 101),
      code,
      nameEn,
      nameKh: nameKh || nameEn,
      categoryId,
      unit,
      estimatedPrice,
      status
    });
  }

  AppData.saveItems(items);
  showToast(t('itemSavedSuccess'), 'success');
  closeModal('itemModal');
  renderItemsTable();
};

window.deleteItem = function(itemId) {
  if (!confirm(t('confirmDelete'))) return;
  let items = AppData.getItems();
  items = items.filter(i => i.id !== itemId);
  AppData.saveItems(items);
  showToast(t('statusUpdatedSuccess'), 'success');
  renderItemsTable();
};

// Master Data: Users
function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  const users = AppData.getUsers();

  tbody.innerHTML = users.map(user => {
    const statusPill = user.status === 'active'
      ? `<span class="badge" style="background:#ecfdf5; color:#047857;">${t('active')}</span>`
      : `<span class="badge" style="background:#fef2f2; color:#b91c1c;">${t('inactive')}</span>`;

    return `
      <tr>
        <td><strong>${user.id}</strong></td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td><span class="badge" style="background:#f1f5f9;">${user.department}</span></td>
        <td><strong>${getRoleName(user.role)}</strong></td>
        <td>${statusPill}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="openEditUserModal('${user.id}')">${t('actionEdit')}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">${t('actionDelete')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAddUserModal = function() {
  AppState.editingUserId = null;
  document.getElementById('userModalTitle').textContent = t('modalAddUserTitle');
  document.getElementById('userFormName').value = '';
  document.getElementById('userFormEmail').value = '';
  document.getElementById('userFormRole').value = 'requester';
  document.getElementById('userFormStatus').value = 'active';

  populateUserDeptDropdown();
  document.getElementById('userModal').classList.add('open');
};

function populateUserDeptDropdown(selectedVal = '') {
  const sel = document.getElementById('userFormDept');
  if (!sel) return;
  const depts = AppData.getDepartments();
  sel.innerHTML = depts.map(d => `
    <option value="${d.id}" ${d.id === selectedVal ? 'selected' : ''}>
      ${AppState.lang === 'kh' ? d.nameKh : d.nameEn}
    </option>
  `).join('');
}

window.openEditUserModal = function(userId) {
  AppState.editingUserId = userId;
  const user = AppData.getUsers().find(u => u.id === userId);
  if (!user) return;

  document.getElementById('userModalTitle').textContent = t('modalEditUserTitle');
  document.getElementById('userFormName').value = user.name;
  document.getElementById('userFormEmail').value = user.email;
  document.getElementById('userFormRole').value = user.role;
  document.getElementById('userFormStatus').value = user.status;

  populateUserDeptDropdown(user.department);
  document.getElementById('userModal').classList.add('open');
};

window.saveUser = function() {
  const name = document.getElementById('userFormName').value.trim();
  const email = document.getElementById('userFormEmail').value.trim();
  const department = document.getElementById('userFormDept').value;
  const role = document.getElementById('userFormRole').value;
  const status = document.getElementById('userFormStatus').value;

  if (!name || !email) {
    showToast('Name and Email are required', 'danger');
    return;
  }

  const users = AppData.getUsers();
  if (AppState.editingUserId) {
    const target = users.find(u => u.id === AppState.editingUserId);
    if (target) {
      target.name = name;
      target.email = email;
      target.department = department;
      target.role = role;
      target.status = status;
    }
  } else {
    users.push({
      id: 'USR-' + String(users.length + 1).padStart(3, '0'),
      name,
      email,
      department,
      role,
      status
    });
  }

  AppData.saveUsers(users);
  showToast(t('itemSavedSuccess'), 'success');
  closeModal('userModal');
  renderUsersTable();
};

window.deleteUser = function(userId) {
  if (!confirm(t('confirmDelete'))) return;
  let users = AppData.getUsers();
  users = users.filter(u => u.id !== userId);
  AppData.saveUsers(users);
  showToast(t('statusUpdatedSuccess'), 'success');
  renderUsersTable();
};

// Export to CSV
function exportRequisitionsToCSV() {
  const requisitions = AppData.getRequisitions();
  if (!requisitions.length) {
    showToast('No requisitions to export', 'info');
    return;
  }

  let csv = 'ID,Date,Needed Date,Department,Requester,Priority,Status,Total Amount,Purpose\n';
  requisitions.forEach(r => {
    const purposeClean = (r.purpose || '').replace(/"/g, '""');
    csv += `"${r.id}","${r.requestDate}","${r.neededDate || ''}","${r.department}","${r.requesterName}","${r.priority}","${r.status}","${r.totalAmount}","${purposeClean}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `procurement_requisitions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Requisitions exported to CSV successfully!', 'success');
}
