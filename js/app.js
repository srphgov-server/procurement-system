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
  requesterPersona: localStorage.getItem('procureflow_req_persona') || 'all',
  requesterSituation: 'all',
  requesterSearch: '',
  requesterPriority: 'all',
  activeModal: null,
  viewingReqId: null,
  editingDepartmentId: null,
  editingPriorityId: null,
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
  initRequesterDashboardListeners();
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

  // Refresh dynamic line items in form if any
  refreshLineItemsLanguage();
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
      if (AppState.role === 'requester' && (AppState.currentTab === 'dashboard' || ['categories', 'items', 'users', 'departments', 'priorities'].includes(AppState.currentTab))) {
        switchTab('requester-dashboard');
      } else {
        renderAll();
      }
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
    populateFilterDropdowns();
    resetLineItemsTable();
  }

  renderCurrentTabView();
}

function renderAll() {
  updateLanguageUI();
  updateRoleVisibility();
  populateFilterDropdowns();
  populateDepartmentSelect();
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

  // If requester is somehow in admin tab, fallback to requester-dashboard
  if (AppState.role !== 'admin' && ['categories', 'items', 'users', 'departments', 'priorities'].includes(AppState.currentTab)) {
    switchTab(AppState.role === 'requester' ? 'requester-dashboard' : 'dashboard');
  }
}

function renderCurrentTabView() {
  switch (AppState.currentTab) {
    case 'dashboard':
      renderRequisitionsTable();
      break;
    case 'requester-dashboard':
      renderRequesterDashboard();
      break;
    case 'departments':
      renderDepartmentsTable();
      break;
    case 'priorities':
      renderPrioritiesTable();
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
  const priorities = AppData.getPriorities ? AppData.getPriorities() : [];

  const container = document.getElementById('priorityPillsContainer');
  if (!container) return;

  let pillsHtml = `
    <div class="priority-pill ${AppState.filters.priority === 'all' ? 'active' : ''}" onclick="setPriorityFilter('all')">
      <span>${t('priorityAll')} (${requisitions.length})</span>
    </div>
  `;

  priorities.forEach(p => {
    const count = requisitions.filter(r => r.priority === p.id).length;
    if (p.status !== 'active' && count === 0) return;
    const name = AppState.lang === 'kh' ? p.nameKh : p.nameEn;
    const pulse = p.id === 'urgent' || p.color === '#ef4444' || (p.slaHours && p.slaHours <= 24) ? '<span class="pulse-dot"></span>' : '';
    pillsHtml += `
      <div class="priority-pill ${p.id} ${AppState.filters.priority === p.id ? 'active' : ''}" onclick="setPriorityFilter('${p.id}')">
        ${pulse}
        <span>${name}: ${count}</span>
      </div>
    `;
  });

  container.innerHTML = pillsHtml;
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
  const depts = AppData.getDepartments();
  const priorities = AppData.getPriorities ? AppData.getPriorities() : [];

  // Filter department select on Requisition Board
  const deptSelect = document.getElementById('filterDepartmentSelect');
  if (deptSelect) {
    const currentVal = deptSelect.value || 'all';
    let html = `<option value="all">${t('allDepartments')}</option>`;
    depts.forEach(d => {
      const name = AppState.lang === 'kh' ? d.nameKh : d.nameEn;
      html += `<option value="${d.id}">${name}</option>`;
    });
    deptSelect.innerHTML = html;
    deptSelect.value = currentVal;
  }

  // Filter priority select on Requisition Board
  const prioSelect = document.getElementById('filterPrioritySelect');
  if (prioSelect) {
    const currentVal = prioSelect.value || 'all';
    let html = `<option value="all">${t('priorityAll')}</option>`;
    priorities.forEach(p => {
      const name = AppState.lang === 'kh' ? p.nameKh : p.nameEn;
      html += `<option value="${p.id}">${name}</option>`;
    });
    prioSelect.innerHTML = html;
    prioSelect.value = currentVal;
  }

  // Requester dashboard priority filter
  const reqPrioFilter = document.getElementById('requesterPriorityFilter');
  if (reqPrioFilter) {
    const currentVal = reqPrioFilter.value || 'all';
    let html = `<option value="all">${t('priorityAll')}</option>`;
    priorities.forEach(p => {
      const name = AppState.lang === 'kh' ? p.nameKh : p.nameEn;
      html += `<option value="${p.id}">${name}</option>`;
    });
    reqPrioFilter.innerHTML = html;
    reqPrioFilter.value = currentVal;
  }

  // Form priority select in New Requisition Form
  const formPrioSelect = document.getElementById('formPrioritySelect');
  if (formPrioSelect) {
    const currentVal = formPrioSelect.value || 'medium';
    const activePriorities = priorities.filter(p => p.status === 'active');
    let html = '';
    activePriorities.forEach(p => {
      const name = AppState.lang === 'kh' ? p.nameKh : p.nameEn;
      const hoursText = p.slaHours ? ` (${p.slaHours}h SLA)` : '';
      html += `<option value="${p.id}">${name}${hoursText}</option>`;
    });
    formPrioSelect.innerHTML = html;
    if (currentVal && activePriorities.some(p => p.id === currentVal)) {
      formPrioSelect.value = currentVal;
    } else if (activePriorities.length > 0) {
      formPrioSelect.value = activePriorities[0].id;
    }
  }
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
    const deptObj = AppData.getDepartments().find(d => d.id === req.department || d.code === req.department);
    const deptName = deptObj ? (AppState.lang === 'kh' ? (deptObj.nameKh || deptObj.nameEn) : (deptObj.nameEn || deptObj.nameKh)) : req.department;
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
  const prios = (typeof AppData !== 'undefined' && AppData.getPriorities) ? AppData.getPriorities() : [];
  const found = prios.find(p => p.id === priority || p.code === priority);

  if (found) {
    const isKhmer = AppState && AppState.lang === 'kh';
    const label = isKhmer ? (found.nameKh || found.nameEn) : (found.nameEn || found.nameKh);
    const pulseDot = (found.slaHours <= 24 || found.color === '#ef4444' || found.id === 'urgent') ? '<span class="pulse-dot"></span>' : '';

    if (found.badgeClass) {
      return `<span class="badge ${found.badgeClass}">${pulseDot}${label}</span>`;
    }
    return `<span class="badge" style="background: ${found.color}15; color: ${found.color}; border: 1px solid ${found.color}40; font-weight:600;">${pulseDot}${label}</span>`;
  }

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
      return `<span class="badge">${priority || '-'}</span>`;
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
  const currentVal = deptSelect.value;
  const depts = AppData.getDepartments().filter(d => d.status === 'active');
  let html = `<option value="">-- ${t('deptSelectPlaceholder')} --</option>`;
  depts.forEach(d => {
    const name = AppState.lang === 'kh' ? (d.nameKh || d.nameEn) : (d.nameEn || d.nameKh);
    html += `<option value="${d.id}">${name}</option>`;
  });
  deptSelect.innerHTML = html;
  if (currentVal && depts.some(d => d.id === currentVal)) {
    deptSelect.value = currentVal;
  }
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

function populateRowItemsDropdown(rowId, categoryId, selectedItemId = '', customName = '') {
  const row = document.getElementById(rowId);
  if (!row) return;

  const catalogSelect = row.querySelector('.item-catalog-select');
  const customWrap = row.querySelector('.custom-item-name-wrap');
  const customInput = row.querySelector('.item-custom-name');
  if (!catalogSelect) return;

  const allItems = AppData.getItems().filter(i => i.status === 'active');
  const catItems = categoryId ? allItems.filter(i => i.categoryId === categoryId) : [];

  let optionsHtml = '';
  if (!categoryId) {
    optionsHtml = `<option value="">-- ${t('selectCategoryFirst')} --</option>`;
  } else {
    const countText = catItems.length > 0 ? `(${catItems.length})` : `(${t('noCatalogItems')})`;
    optionsHtml = `<option value="">-- ${t('colItemSelect')} ${countText} --</option>`;
  }

  catItems.forEach(item => {
    const itemName = AppState.lang === 'kh' ? (item.nameKh || item.nameEn) : (item.nameEn || item.nameKh);
    const isSelected = selectedItemId && selectedItemId === item.id;
    optionsHtml += `<option value="${item.id}" data-cat="${item.categoryId}" data-unit="${item.unit || 'Unit'}" data-price="${item.estimatedPrice || 0}" ${isSelected ? 'selected' : ''}>${item.code} - ${itemName} ($${Number(item.estimatedPrice || 0).toFixed(2)})</option>`;
  });

  // Custom Item option is always available under the category
  const isCustom = selectedItemId === 'custom' || (!selectedItemId && Boolean(customName)) || (selectedItemId && String(selectedItemId).startsWith('custom-'));
  optionsHtml += `<option value="custom" ${isCustom ? 'selected' : ''}>✏️ ${t('customItemOption')}</option>`;

  catalogSelect.innerHTML = optionsHtml;

  if (isCustom) {
    catalogSelect.value = 'custom';
    if (customWrap) customWrap.style.display = 'block';
    if (customInput) {
      customInput.required = true;
      if (customName) customInput.value = customName;
    }
  } else if (selectedItemId && catItems.some(i => i.id === selectedItemId)) {
    catalogSelect.value = selectedItemId;
    if (customWrap) customWrap.style.display = 'none';
    if (customInput) {
      customInput.required = false;
      customInput.value = '';
    }
  } else {
    catalogSelect.value = '';
    if (customWrap) customWrap.style.display = 'none';
    if (customInput) {
      customInput.required = false;
      customInput.value = '';
    }
  }
}

function addLineItemRow(data = null) {
  const tbody = document.getElementById('lineItemsTbody');
  if (!tbody) return;
  lineItemCounter++;
  const rowId = `row-${lineItemCounter}`;
  const categories = AppData.getCategories().filter(c => c.status === 'active');

  // Determine initial category
  let initialCatId = '';
  if (data && data.categoryId) {
    initialCatId = data.categoryId;
  } else if (data && data.itemId && !String(data.itemId).startsWith('custom-')) {
    const matchedItem = AppData.getItems().find(i => i.id === data.itemId);
    if (matchedItem) initialCatId = matchedItem.categoryId;
  } else if (categories.length > 0) {
    initialCatId = categories[0].id;
  }

  let catOptionsHtml = `<option value="">-- ${t('selectCategoryPrompt')} --</option>`;
  categories.forEach(cat => {
    const catName = AppState.lang === 'kh' ? (cat.nameKh || cat.nameEn) : (cat.nameEn || cat.nameKh);
    const isSelected = cat.id === initialCatId;
    catOptionsHtml += `<option value="${cat.id}" ${isSelected ? 'selected' : ''}>${catName}</option>`;
  });

  const tr = document.createElement('tr');
  tr.id = rowId;
  tr.innerHTML = `
    <td>
      <select class="form-select item-category-select" onchange="onCategoryChanged('${rowId}', this.value)" required>
        ${catOptionsHtml}
      </select>
    </td>
    <td>
      <select class="form-select item-catalog-select" onchange="onCatalogItemSelected('${rowId}', this.value)" required>
        <!-- Populated dynamically based on selected Category -->
      </select>
      <div class="custom-item-name-wrap" style="display:none; margin-top:6px;">
        <input type="text" class="form-input item-custom-name" placeholder="${t('customItemPlaceholder') || 'Enter custom item name...'}" />
      </div>
    </td>
    <td>
      <input type="text" class="form-input item-spec" placeholder="Specs, brand, model..." />
    </td>
    <td style="width: 90px;">
      <input type="number" min="1" value="1" class="form-input item-qty" oninput="calculateRowSubtotal('${rowId}')" />
    </td>
    <td style="width: 100px;">
      <input type="text" value="Unit" class="form-input item-unit" placeholder="Unit" />
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

  if (data) {
    const isCustom = (data.itemId && String(data.itemId).startsWith('custom-')) || (!data.itemId && data.itemName);
    const selectedItemId = isCustom ? 'custom' : (data.itemId || '');
    const customName = isCustom ? (data.itemName || '') : '';

    populateRowItemsDropdown(rowId, initialCatId, selectedItemId, customName);

    const specInput = tr.querySelector('.item-spec');
    const qtyInput = tr.querySelector('.item-qty');
    const unitInput = tr.querySelector('.item-unit');
    const priceInput = tr.querySelector('.item-price');

    if (data.spec) specInput.value = data.spec;
    if (data.qty !== undefined) qtyInput.value = data.qty;
    if (data.unit) unitInput.value = data.unit;
    if (data.unitPrice !== undefined) priceInput.value = Number(data.unitPrice).toFixed(2);
  } else {
    populateRowItemsDropdown(rowId, initialCatId, '', '');
  }

  calculateRowSubtotal(rowId);
}

window.onCategoryChanged = function(rowId, categoryId) {
  const row = document.getElementById(rowId);
  if (!row) return;

  const catalogSelect = row.querySelector('.item-catalog-select');
  const customInput = row.querySelector('.item-custom-name');
  const unitInput = row.querySelector('.item-unit');
  const priceInput = row.querySelector('.item-price');

  const currentVal = catalogSelect ? catalogSelect.value : '';
  const currentCustom = customInput ? customInput.value.trim() : '';
  const wasCustom = currentVal === 'custom' || currentVal.startsWith('custom-') || Boolean(currentCustom);

  populateRowItemsDropdown(rowId, categoryId, wasCustom ? 'custom' : '', wasCustom ? currentCustom : '');

  if (!wasCustom) {
    if (unitInput) unitInput.value = 'Unit';
    if (priceInput) priceInput.value = '0.00';
    calculateRowSubtotal(rowId);
  }
};

window.onCatalogItemSelected = function(rowId, itemId) {
  const row = document.getElementById(rowId);
  if (!row) return;

  const customWrap = row.querySelector('.custom-item-name-wrap');
  const customInput = row.querySelector('.item-custom-name');
  const catSelect = row.querySelector('.item-category-select');
  const unitInput = row.querySelector('.item-unit');
  const priceInput = row.querySelector('.item-price');

  if (itemId === 'custom') {
    if (customWrap) customWrap.style.display = 'block';
    if (customInput) {
      customInput.required = true;
      customInput.focus();
    }
    if (unitInput && !unitInput.value) unitInput.value = 'Unit';
  } else if (itemId) {
    if (customWrap) customWrap.style.display = 'none';
    if (customInput) {
      customInput.required = false;
      customInput.value = '';
    }
    const item = AppData.getItems().find(i => i.id === itemId);
    if (item) {
      if (catSelect && (!catSelect.value || catSelect.value !== item.categoryId)) {
        catSelect.value = item.categoryId;
      }
      if (unitInput) unitInput.value = item.unit || 'Unit';
      if (priceInput) priceInput.value = Number(item.estimatedPrice || 0).toFixed(2);
    }
  } else {
    if (customWrap) customWrap.style.display = 'none';
    if (customInput) {
      customInput.required = false;
      customInput.value = '';
    }
  }

  calculateRowSubtotal(rowId);
};

function refreshLineItemsLanguage() {
  const rows = document.querySelectorAll('#lineItemsTbody tr');
  if (!rows || rows.length === 0) return;
  rows.forEach(row => {
    const catSelect = row.querySelector('.item-category-select');
    const catalogSelect = row.querySelector('.item-catalog-select');
    const customInput = row.querySelector('.item-custom-name');
    if (!catSelect || !catalogSelect) return;

    const currentCat = catSelect.value;
    const currentItem = catalogSelect.value;
    const currentCustom = customInput ? customInput.value : '';

    const categories = AppData.getCategories().filter(c => c.status === 'active');
    let catOptionsHtml = `<option value="">-- ${t('selectCategoryPrompt')} --</option>`;
    categories.forEach(cat => {
      const catName = AppState.lang === 'kh' ? (cat.nameKh || cat.nameEn) : (cat.nameEn || cat.nameKh);
      const isSelected = cat.id === currentCat;
      catOptionsHtml += `<option value="${cat.id}" ${isSelected ? 'selected' : ''}>${catName}</option>`;
    });
    catSelect.innerHTML = catOptionsHtml;

    populateRowItemsDropdown(row.id, currentCat, currentItem, currentCustom);
  });
}

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
  let validationError = '';

  rows.forEach(row => {
    if (validationError) return;
    const catSelect = row.querySelector('.item-category-select');
    const catalogSelect = row.querySelector('.item-catalog-select');
    const customInput = row.querySelector('.item-custom-name');
    const spec = row.querySelector('.item-spec').value.trim();
    const qty = parseFloat(row.querySelector('.item-qty').value) || 1;
    const unit = row.querySelector('.item-unit').value.trim() || 'Unit';
    const unitPrice = parseFloat(row.querySelector('.item-price').value) || 0;
    const subtotal = qty * unitPrice;

    if (!catSelect || !catSelect.value) {
      validationError = 'Please select a Category for all line items.';
      return;
    }

    let itemName = '';
    let itemId = '';
    if (catalogSelect.value === 'custom') {
      itemName = customInput.value.trim();
      if (!itemName) {
        validationError = 'Please enter a custom item name for custom line items.';
        return;
      }
      itemId = 'custom-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    } else if (catalogSelect.value) {
      const itm = AppData.getItems().find(i => i.id === catalogSelect.value);
      itemName = itm ? (AppState.lang === 'kh' ? (itm.nameKh || itm.nameEn) : (itm.nameEn || itm.nameKh)) : 'Item';
      itemId = catalogSelect.value;
    } else if (customInput && customInput.value.trim()) {
      itemName = customInput.value.trim();
      itemId = 'custom-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    } else {
      validationError = 'Please select a catalog item or choose Custom Item Name.';
      return;
    }

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
  });

  if (validationError) {
    showToast(validationError, 'danger');
    return;
  }

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

  const deptObj = AppData.getDepartments().find(d => d.id === req.department || d.code === req.department);
  const deptName = deptObj ? (AppState.lang === 'kh' ? (deptObj.nameKh || deptObj.nameEn) : (deptObj.nameEn || deptObj.nameKh)) : req.department;

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

// Master Data: Requesting Departments
function renderDepartmentsTable() {
  const tbody = document.getElementById('departmentsTableBody');
  if (!tbody) return;
  const departments = AppData.getDepartments();
  const requisitions = AppData.getRequisitions();

  tbody.innerHTML = departments.map(dept => {
    const reqCount = requisitions.filter(r => r.department === dept.id || r.department === dept.code).length;
    const statusPill = dept.status === 'active'
      ? `<span class="badge" style="background:#ecfdf5; color:#047857;">${t('active')}</span>`
      : `<span class="badge" style="background:#fef2f2; color:#b91c1c;">${t('inactive')}</span>`;

    return `
      <tr>
        <td><strong>${dept.code || dept.id}</strong></td>
        <td><code>${dept.id}</code></td>
        <td>${dept.nameEn}</td>
        <td>${dept.nameKh || '-'}</td>
        <td style="color:#64748b; font-size:13px;">${dept.desc || '-'}</td>
        <td><span class="badge" style="background:#f1f5f9;">${reqCount} ${t('navRequisitions').toLowerCase()}</span></td>
        <td>${statusPill}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="openEditDepartmentModal('${dept.id}')">${t('actionEdit')}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteDepartment('${dept.id}')">${t('actionDelete')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAddDepartmentModal = function() {
  AppState.editingDepartmentId = null;
  document.getElementById('deptModalTitle').textContent = t('modalAddDeptTitle');
  document.getElementById('deptFormCode').value = '';
  document.getElementById('deptFormId').value = '';
  document.getElementById('deptFormId').disabled = false;
  document.getElementById('deptFormNameEn').value = '';
  document.getElementById('deptFormNameKh').value = '';
  document.getElementById('deptFormDesc').value = '';
  document.getElementById('deptFormStatus').value = 'active';
  document.getElementById('departmentModal').classList.add('open');
};

window.openEditDepartmentModal = function(deptId) {
  AppState.editingDepartmentId = deptId;
  const dept = AppData.getDepartments().find(d => d.id === deptId);
  if (!dept) return;

  document.getElementById('deptModalTitle').textContent = t('modalEditDeptTitle');
  document.getElementById('deptFormCode').value = dept.code || dept.id;
  document.getElementById('deptFormId').value = dept.id;
  document.getElementById('deptFormId').disabled = true;
  document.getElementById('deptFormNameEn').value = dept.nameEn;
  document.getElementById('deptFormNameKh').value = dept.nameKh || '';
  document.getElementById('deptFormDesc').value = dept.desc || '';
  document.getElementById('deptFormStatus').value = dept.status || 'active';
  document.getElementById('departmentModal').classList.add('open');
};

window.saveDepartment = function() {
  const code = document.getElementById('deptFormCode').value.trim();
  const id = document.getElementById('deptFormId').value.trim();
  const nameEn = document.getElementById('deptFormNameEn').value.trim();
  const nameKh = document.getElementById('deptFormNameKh').value.trim();
  const desc = document.getElementById('deptFormDesc').value.trim();
  const status = document.getElementById('deptFormStatus').value;

  if (!code || !nameEn) {
    showToast('Department Code and English Name are required', 'danger');
    return;
  }

  const departments = AppData.getDepartments();

  if (AppState.editingDepartmentId) {
    const target = departments.find(d => d.id === AppState.editingDepartmentId);
    if (target) {
      target.code = code;
      target.nameEn = nameEn;
      target.nameKh = nameKh || nameEn;
      target.desc = desc;
      target.status = status;
    }
  } else {
    const cleanId = (id || code).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!cleanId) {
      showToast('A valid Dept Key / ID is required', 'danger');
      return;
    }
    if (departments.some(d => d.id.toLowerCase() === cleanId.toLowerCase())) {
      showToast('A department with this Key / ID already exists', 'danger');
      return;
    }
    departments.push({
      id: cleanId,
      code,
      nameEn,
      nameKh: nameKh || nameEn,
      desc,
      status
    });
  }

  AppData.saveDepartments(departments);
  showToast(t('itemSavedSuccess'), 'success');
  closeModal('departmentModal');
  renderDepartmentsTable();
  populateFilterDropdowns();
  populateDepartmentSelect();
};

window.deleteDepartment = function(deptId) {
  const requisitions = AppData.getRequisitions();
  const inUse = requisitions.some(r => r.department === deptId);
  if (inUse) {
    showToast(`Cannot delete: Department is used in existing requisitions. Set status to Inactive instead.`, 'danger');
    return;
  }
  if (!confirm(t('confirmDelete'))) return;
  let departments = AppData.getDepartments();
  departments = departments.filter(d => d.id !== deptId);
  AppData.saveDepartments(departments);
  showToast(t('statusUpdatedSuccess'), 'success');
  renderDepartmentsTable();
  populateFilterDropdowns();
  populateDepartmentSelect();
};

// Master Data: Urgency / Priority Levels
function renderPrioritiesTable() {
  const tbody = document.getElementById('prioritiesTableBody');
  if (!tbody) return;
  const priorities = AppData.getPriorities ? AppData.getPriorities() : [];
  const requisitions = AppData.getRequisitions();

  tbody.innerHTML = priorities.map(prio => {
    const reqCount = requisitions.filter(r => r.priority === prio.id).length;
    const statusPill = prio.status === 'active'
      ? `<span class="badge" style="background:#ecfdf5; color:#047857;">${t('active')}</span>`
      : `<span class="badge" style="background:#fef2f2; color:#b91c1c;">${t('inactive')}</span>`;

    const previewBadge = getPriorityBadge(prio.id);

    return `
      <tr>
        <td><strong>${prio.code || prio.id.toUpperCase()}</strong></td>
        <td><code>${prio.id}</code></td>
        <td>${prio.nameEn}</td>
        <td>${prio.nameKh || '-'}</td>
        <td><strong>${prio.slaHours ? prio.slaHours + ' hrs' : '-'}</strong></td>
        <td>${previewBadge}</td>
        <td style="color:#64748b; font-size:13px;">${prio.desc || '-'}</td>
        <td><span class="badge" style="background:#f1f5f9;">${reqCount} ${t('navRequisitions').toLowerCase()}</span></td>
        <td>${statusPill}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="openEditPriorityModal('${prio.id}')">${t('actionEdit')}</button>
            <button class="btn btn-sm btn-danger" onclick="deletePriority('${prio.id}')">${t('actionDelete')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAddPriorityModal = function() {
  AppState.editingPriorityId = null;
  document.getElementById('prioModalTitle').textContent = t('modalAddPrioTitle');
  document.getElementById('prioFormCode').value = '';
  document.getElementById('prioFormId').value = '';
  document.getElementById('prioFormId').disabled = false;
  document.getElementById('prioFormNameEn').value = '';
  document.getElementById('prioFormNameKh').value = '';
  document.getElementById('prioFormSla').value = '24';
  document.getElementById('prioFormColor').value = '#ef4444';
  document.getElementById('prioFormDesc').value = '';
  document.getElementById('prioFormStatus').value = 'active';
  document.getElementById('priorityModal').classList.add('open');
};

window.openEditPriorityModal = function(prioId) {
  AppState.editingPriorityId = prioId;
  const prio = (AppData.getPriorities ? AppData.getPriorities() : []).find(p => p.id === prioId);
  if (!prio) return;

  document.getElementById('prioModalTitle').textContent = t('modalEditPrioTitle');
  document.getElementById('prioFormCode').value = prio.code || prio.id.toUpperCase();
  document.getElementById('prioFormId').value = prio.id;
  document.getElementById('prioFormId').disabled = true;
  document.getElementById('prioFormNameEn').value = prio.nameEn;
  document.getElementById('prioFormNameKh').value = prio.nameKh || '';
  document.getElementById('prioFormSla').value = prio.slaHours || 24;
  document.getElementById('prioFormColor').value = prio.color || '#3b82f6';
  document.getElementById('prioFormDesc').value = prio.desc || '';
  document.getElementById('prioFormStatus').value = prio.status || 'active';
  document.getElementById('priorityModal').classList.add('open');
};

window.savePriority = function() {
  const code = document.getElementById('prioFormCode').value.trim();
  const id = document.getElementById('prioFormId').value.trim();
  const nameEn = document.getElementById('prioFormNameEn').value.trim();
  const nameKh = document.getElementById('prioFormNameKh').value.trim();
  const slaHours = parseInt(document.getElementById('prioFormSla').value) || 24;
  const color = document.getElementById('prioFormColor').value;
  const desc = document.getElementById('prioFormDesc').value.trim();
  const status = document.getElementById('prioFormStatus').value;

  if (!code || !nameEn) {
    showToast('Priority Code and English Name are required', 'danger');
    return;
  }

  const priorities = AppData.getPriorities ? AppData.getPriorities() : [];

  const badgeClassMap = {
    'urgent': 'badge-priority-urgent',
    'high': 'badge-priority-high',
    'medium': 'badge-priority-medium',
    'low': 'badge-priority-low'
  };

  if (AppState.editingPriorityId) {
    const target = priorities.find(p => p.id === AppState.editingPriorityId);
    if (target) {
      target.code = code;
      target.nameEn = nameEn;
      target.nameKh = nameKh || nameEn;
      target.slaHours = slaHours;
      target.color = color;
      target.desc = desc;
      target.status = status;
      if (badgeClassMap[target.id]) {
        target.badgeClass = badgeClassMap[target.id];
      }
    }
  } else {
    const cleanId = (id || code).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanId) {
      showToast('A valid Priority Key / ID is required', 'danger');
      return;
    }
    if (priorities.some(p => p.id.toLowerCase() === cleanId.toLowerCase())) {
      showToast('A priority with this Key / ID already exists', 'danger');
      return;
    }
    priorities.push({
      id: cleanId,
      code,
      nameEn,
      nameKh: nameKh || nameEn,
      slaHours,
      color,
      badgeClass: badgeClassMap[cleanId] || '',
      desc,
      status
    });
  }

  AppData.savePriorities(priorities);
  showToast(t('itemSavedSuccess'), 'success');
  closeModal('priorityModal');
  renderPrioritiesTable();
  renderPriorityPills();
  populateFilterDropdowns();
  if (AppState.currentTab === 'board' || AppState.currentTab === 'dashboard') renderRequisitionsTable();
  if (AppState.currentTab === 'requester-dashboard') renderRequesterDashboard();
};

window.deletePriority = function(prioId) {
  const requisitions = AppData.getRequisitions();
  const inUse = requisitions.some(r => r.priority === prioId);
  if (inUse) {
    showToast(`Cannot delete: Priority is used in existing requisitions. Set status to Inactive instead.`, 'danger');
    return;
  }
  if (!confirm(t('confirmDelete'))) return;
  let priorities = AppData.getPriorities ? AppData.getPriorities() : [];
  priorities = priorities.filter(p => p.id !== prioId);
  AppData.savePriorities(priorities);
  showToast(t('statusUpdatedSuccess'), 'success');
  renderPrioritiesTable();
  renderPriorityPills();
  populateFilterDropdowns();
  if (AppState.currentTab === 'board' || AppState.currentTab === 'dashboard') renderRequisitionsTable();
  if (AppState.currentTab === 'requester-dashboard') renderRequesterDashboard();
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

// =========================================================================
// Separated Requester Dashboard & Management Situation Controller
// =========================================================================

function initRequesterDashboardListeners() {
  const personaSelect = document.getElementById('requesterPersonaSelect');
  const searchInput = document.getElementById('requesterSearchInput');
  const priorityFilter = document.getElementById('requesterPriorityFilter');

  if (personaSelect) {
    personaSelect.addEventListener('change', (e) => {
      AppState.requesterPersona = e.target.value;
      localStorage.setItem('procureflow_req_persona', AppState.requesterPersona);
      renderRequesterDashboard();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.requesterSearch = e.target.value.toLowerCase().trim();
      renderRequesterDashboard();
    });
  }

  if (priorityFilter) {
    priorityFilter.addEventListener('change', (e) => {
      AppState.requesterPriority = e.target.value;
      renderRequesterDashboard();
    });
  }
}

function populateRequesterPersonas() {
  const select = document.getElementById('requesterPersonaSelect');
  if (!select) return;

  const currentVal = AppState.requesterPersona || 'all';
  const requisitions = AppData.getRequisitions();
  const users = AppData.getUsers().filter(u => u.status === 'active');
  const distinctRequesters = [];
  const seen = new Set();

  users.forEach(u => {
    if (!seen.has(u.name)) {
      seen.add(u.name);
      distinctRequesters.push({ name: u.name, dept: u.department, email: u.email });
    }
  });

  requisitions.forEach(r => {
    if (r.requesterName && !seen.has(r.requesterName)) {
      seen.add(r.requesterName);
      distinctRequesters.push({ name: r.requesterName, dept: r.department, email: r.requesterEmail });
    }
  });

  let optionsHtml = `<option value="all">🌟 ${t('requesterAllProfiles')}</option>`;
  distinctRequesters.forEach(reqUser => {
    const isSelected = currentVal === reqUser.name ? 'selected' : '';
    optionsHtml += `<option value="${reqUser.name}" ${isSelected}>👤 ${reqUser.name} (${reqUser.dept})</option>`;
  });

  select.innerHTML = optionsHtml;
  select.value = currentVal;
}

window.setRequesterSituationFilter = function(situation) {
  AppState.requesterSituation = situation;
  renderRequesterDashboard();
};

function renderRequesterDashboard() {
  const container = document.getElementById('requesterListContainer');
  if (!container) return;

  populateRequesterPersonas();

  const allReqs = AppData.getRequisitions();

  // Filter by selected persona if not 'all'
  let personaReqs = allReqs;
  if (AppState.requesterPersona && AppState.requesterPersona !== 'all') {
    personaReqs = allReqs.filter(r => r.requesterName === AppState.requesterPersona);
  }

  // Calculate Situation Metrics for this requester/department
  const totalCount = personaReqs.length;
  const totalAmt = personaReqs.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  const reviewCount = personaReqs.filter(r => r.status === 'under_review' || r.status === 'new').length;
  const approvedCount = personaReqs.filter(r => r.status === 'approved').length;
  const declinedCount = personaReqs.filter(r => r.status === 'rejected').length;
  const completedCount = personaReqs.filter(r => r.status === 'completed').length;

  // Update KPI Card Numbers
  const kpiTotalVal = document.getElementById('reqKpiTotalVal');
  const kpiTotalAmt = document.getElementById('reqKpiTotalAmt');
  const kpiReviewVal = document.getElementById('reqKpiReviewVal');
  const kpiApprovedVal = document.getElementById('reqKpiApprovedVal');
  const kpiDeclinedVal = document.getElementById('reqKpiDeclinedVal');
  const kpiCompletedVal = document.getElementById('reqKpiCompletedVal');

  if (kpiTotalVal) kpiTotalVal.textContent = totalCount;
  if (kpiTotalAmt) kpiTotalAmt.textContent = formatCurrency(totalAmt);
  if (kpiReviewVal) kpiReviewVal.textContent = reviewCount;
  if (kpiApprovedVal) kpiApprovedVal.textContent = approvedCount;
  if (kpiDeclinedVal) kpiDeclinedVal.textContent = declinedCount;
  if (kpiCompletedVal) kpiCompletedVal.textContent = completedCount;

  // Update situation pill counters
  const sitCountAll = document.getElementById('sitCountAll');
  const sitCountReview = document.getElementById('sitCountReview');
  const sitCountApproved = document.getElementById('sitCountApproved');
  const sitCountDeclined = document.getElementById('sitCountDeclined');
  const sitCountCompleted = document.getElementById('sitCountCompleted');

  if (sitCountAll) sitCountAll.textContent = totalCount;
  if (sitCountReview) sitCountReview.textContent = reviewCount;
  if (sitCountApproved) sitCountApproved.textContent = approvedCount;
  if (sitCountDeclined) sitCountDeclined.textContent = declinedCount;
  if (sitCountCompleted) sitCountCompleted.textContent = completedCount;

  // Update situation pill active states
  document.querySelectorAll('.situation-pill').forEach(btn => {
    if (btn.getAttribute('data-sit') === AppState.requesterSituation) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Situation Alert Banners
  const declinedAlert = document.getElementById('requesterDeclinedAlert');
  const approvedAlert = document.getElementById('requesterApprovedAlert');
  const declinedAlertText = document.getElementById('requesterDeclinedAlertText');
  const approvedAlertText = document.getElementById('requesterApprovedAlertText');

  if (declinedAlert) {
    if (declinedCount > 0) {
      declinedAlert.style.display = 'flex';
      const declinedItems = personaReqs.filter(r => r.status === 'rejected');
      const latestDeclined = declinedItems[0];
      const reasonSnippet = latestDeclined.remarks ? `"${latestDeclined.remarks}"` : '';
      if (declinedAlertText) {
        declinedAlertText.innerHTML = AppState.lang === 'kh'
          ? `ថ្នាក់ដឹកនាំបានបដិសេធសំណើចំនួន <strong>${declinedCount}</strong> (ឧ. <strong>${latestDeclined.id}</strong>៖ <em>${reasonSnippet}</em>)។ សូមពិនិត្យមើលមូលហេតុ និងចុច <strong>កែសម្រួល & ដាក់ស្នើឡើងវិញ</strong> ដើម្បីកែប្រែ។`
          : `Management has declined <strong>${declinedCount}</strong> requisition(s) (e.g. <strong>${latestDeclined.id}</strong>: <em>${reasonSnippet}</em>). Review the feedback reasons below and click <strong>Modify & Re-submit</strong> to revise.`;
      }
    } else {
      declinedAlert.style.display = 'none';
    }
  }

  if (approvedAlert) {
    if (approvedCount > 0 && declinedCount === 0) {
      approvedAlert.style.display = 'flex';
      const approvedItems = personaReqs.filter(r => r.status === 'approved');
      const latestApproved = approvedItems[0];
      if (approvedAlertText) {
        approvedAlertText.innerHTML = AppState.lang === 'kh'
          ? `សំណើចំនួន <strong>${approvedCount}</strong> (ឧ. <strong>${latestApproved.id}</strong>) ត្រូវបានថ្នាក់ដឹកនាំអនុម័តរួចរាល់ និងបានបញ្ជូនទៅផ្នែកលទ្ធកម្មដើម្បីបញ្ជាទិញ។`
          : `<strong>${approvedCount}</strong> requisition(s) (e.g. <strong>${latestApproved.id}</strong>) have been approved by Management and forwarded to Procurement for purchasing.`;
      }
    } else {
      approvedAlert.style.display = 'none';
    }
  }

  // Filter list by situation filter
  let displayList = personaReqs;
  if (AppState.requesterSituation === 'under_review') {
    displayList = displayList.filter(r => r.status === 'under_review' || r.status === 'new');
  } else if (AppState.requesterSituation === 'approved') {
    displayList = displayList.filter(r => r.status === 'approved');
  } else if (AppState.requesterSituation === 'rejected') {
    displayList = displayList.filter(r => r.status === 'rejected');
  } else if (AppState.requesterSituation === 'completed') {
    displayList = displayList.filter(r => r.status === 'completed');
  }

  // Filter list by search query
  if (AppState.requesterSearch) {
    const term = AppState.requesterSearch;
    displayList = displayList.filter(r => 
      r.id.toLowerCase().includes(term) ||
      (r.purpose && r.purpose.toLowerCase().includes(term)) ||
      (r.remarks && r.remarks.toLowerCase().includes(term)) ||
      (r.items && r.items.some(i => i.itemName.toLowerCase().includes(term)))
    );
  }

  // Filter list by priority
  if (AppState.requesterPriority && AppState.requesterPriority !== 'all') {
    displayList = displayList.filter(r => r.priority === AppState.requesterPriority);
  }

  if (displayList.length === 0) {
    container.innerHTML = `
      <div class="data-card" style="text-align:center; padding: 60px 20px; color: var(--text-muted);">
        <div style="font-size: 40px; margin-bottom: 12px;">📂</div>
        <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">${t('noRequesterRequests')}</h4>
        <p style="font-size: 13px; max-width: 450px; margin: 0 auto 16px;">
          ${AppState.lang === 'kh' ? 'អ្នកអាចបង្កើតសំណើសុំទិញសម្ភារៈថ្មីដោយចុចប៊ូតុងខាងក្រោម' : 'You can submit a new purchase requisition anytime by clicking the button below.'}
        </p>
        <button class="btn btn-primary" onclick="switchTab('new-request')">${t('navNewRequest')}</button>
      </div>
    `;
    return;
  }

  // Render cards feed
  container.innerHTML = displayList.map(req => {
    return buildRequesterCardHtml(req);
  }).join('');
}

function buildRequesterCardHtml(req) {
  const deptObj = AppData.getDepartments().find(d => d.id === req.department || d.code === req.department);
  const deptName = deptObj ? (AppState.lang === 'kh' ? (deptObj.nameKh || deptObj.nameEn) : (deptObj.nameEn || deptObj.nameKh)) : req.department;
  const priorityBadge = getPriorityBadge(req.priority);
  const statusBadge = getStatusBadge(req.status);

  // Stepper Stage Calculation
  // Stage 1: Submitted (always done)
  const step1Class = 'completed';
  const step1Icon = '✓';
  const step1Detail = req.requestDate;

  // Stage 2: Management Review
  let step2Class = 'pending';
  let step2Icon = '2';
  let step2Detail = t('stageStatusWait');
  if (req.status === 'new') {
    step2Class = 'active';
    step2Icon = '⏳';
    step2Detail = t('stageStatusWait');
  } else if (req.status === 'under_review') {
    step2Class = 'active';
    step2Icon = '⏳';
    step2Detail = t('stageStatusActiveReview');
  } else {
    step2Class = 'completed';
    step2Icon = '✓';
    step2Detail = AppState.lang === 'kh' ? 'បានពិនិត្យរួចរាល់' : 'Reviewed';
  }

  // Stage 3: Management Decision (Approve / Decline)
  let step3Class = 'pending';
  let step3Icon = '3';
  let step3Detail = AppState.lang === 'kh' ? 'រង់ចាំការសម្រេច' : 'Pending Decision';
  if (req.status === 'approved' || req.status === 'completed') {
    step3Class = 'completed';
    step3Icon = '✓';
    step3Detail = t('statusApproved');
  } else if (req.status === 'rejected') {
    step3Class = 'declined';
    step3Icon = '✕';
    step3Detail = t('statusRejected');
  }

  // Stage 4: Fulfillment / Delivery
  let step4Class = 'pending';
  let step4Icon = '4';
  let step4Detail = AppState.lang === 'kh' ? 'រង់ចាំការអនុម័ត' : 'Awaiting Approval';
  if (req.status === 'completed') {
    step4Class = 'completed';
    step4Icon = '★';
    step4Detail = t('statusCompleted');
  } else if (req.status === 'approved') {
    step4Class = 'active';
    step4Icon = '📦';
    step4Detail = AppState.lang === 'kh' ? 'កំពុងរៀបចំបញ្ជាទិញ' : 'PO in progress';
  } else if (req.status === 'rejected') {
    step4Class = 'pending';
    step4Icon = '✕';
    step4Detail = AppState.lang === 'kh' ? 'បានផ្អាកការបញ្ជាទិញ' : 'Order stopped';
  }

  // Stepper progress line width and color
  let progressWidth = '25%';
  let progressColor = 'var(--success)';
  if (req.status === 'new') {
    progressWidth = '25%';
    progressColor = '#f59e0b';
  } else if (req.status === 'under_review') {
    progressWidth = '45%';
    progressColor = '#f59e0b';
  } else if (req.status === 'rejected') {
    progressWidth = '75%';
    progressColor = 'var(--danger)';
  } else if (req.status === 'approved') {
    progressWidth = '75%';
    progressColor = 'var(--success)';
  } else if (req.status === 'completed') {
    progressWidth = '100%';
    progressColor = '#8b5cf6';
  }

  // Management Feedback / Remarks Callout Box
  let feedbackBoxHtml = '';
  if (req.status === 'rejected') {
    feedbackBoxHtml = `
      <div class="mgmt-feedback-box declined">
        <div>
          <div class="mgmt-feedback-title">
            <span>❌</span>
            <span>${t('mgmtRemarksTitle')}: ${t('statusRejected')}</span>
          </div>
          <div class="mgmt-feedback-text">
            "${req.remarks || 'No detailed reason provided.'}"
          </div>
        </div>
        <button class="btn btn-sm btn-primary" onclick="cloneRequisitionToNew('${req.id}')" style="background:#be123c; border-color:#9f1239; white-space:nowrap;">
          🔄 ${t('btnResubmitModify')}
        </button>
      </div>
    `;
  } else if (req.status === 'approved') {
    feedbackBoxHtml = `
      <div class="mgmt-feedback-box approved">
        <div>
          <div class="mgmt-feedback-title">
            <span>✅</span>
            <span>${t('mgmtRemarksTitle')}: ${t('statusApproved')}</span>
          </div>
          <div class="mgmt-feedback-text">
            "${req.remarks || 'Approved by Management & Admin.'}"
          </div>
        </div>
        <button class="btn btn-sm btn-outline" onclick="printRequisition('${req.id}')" style="white-space:nowrap;">
          🖨️ ${t('actionPrint')}
        </button>
      </div>
    `;
  } else if (req.status === 'under_review') {
    feedbackBoxHtml = `
      <div class="mgmt-feedback-box under_review">
        <div>
          <div class="mgmt-feedback-title">
            <span>⏳</span>
            <span>${t('mgmtRemarksTitle')}: ${t('statusUnderReview')}</span>
          </div>
          <div class="mgmt-feedback-text">
            "${req.remarks || 'Under management review and budget verification.'}"
          </div>
        </div>
      </div>
    `;
  }

  // Items table preview (up to 4 items)
  const itemsRows = (req.items || []).map((itm, idx) => {
    return `
      <tr>
        <td style="font-weight:600; width:35px;">#${idx + 1}</td>
        <td>
          <div style="font-weight:700;">${itm.itemName}</div>
          <div style="font-size:11.5px; color:var(--text-light);">${itm.spec || '-'}</div>
        </td>
        <td><strong>${itm.qty}</strong> ${itm.unit}</td>
        <td>${formatCurrency(itm.unitPrice)}</td>
        <td style="text-align:right; font-weight:700; color:var(--text-main);">${formatCurrency(itm.subtotal)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="req-card status-${req.status}">
      <!-- Header -->
      <div class="req-card-header">
        <div class="req-card-id-block">
          <span class="req-card-id">${req.id}</span>
          ${statusBadge}
          ${priorityBadge}
        </div>
        <div class="req-card-meta">
          <span class="req-card-meta-item">
            📅 ${req.requestDate}
          </span>
          <span class="req-card-meta-item">
            ⏰ ${AppState.lang === 'kh' ? 'ត្រូវការត្រឹម៖ ' : 'Need by: '}<strong style="color:var(--text-main);">${req.neededDate || '-'}</strong>
          </span>
          <span class="badge" style="background:#e2e8f0; color:#334155; font-weight:600;">
            ${deptName}
          </span>
        </div>
      </div>

      <!-- Body -->
      <div class="req-card-body">
        <!-- 4-Stage Progress Stepper -->
        <div class="workflow-stepper-box">
          <div class="stepper-header-title">
            <span>⚡</span>
            <span>${t('approvalStage')} (Management Situation Tracker)</span>
          </div>
          <div class="stepper">
            <div class="stepper-line">
              <div class="stepper-line-progress" style="width: ${progressWidth}; background: ${progressColor};"></div>
            </div>

            <!-- Step 1 -->
            <div class="stepper-step ${step1Class}">
              <div class="step-circle">${step1Icon}</div>
              <div class="step-name">${t('stageSubmitted')}</div>
              <div class="step-detail">${step1Detail}</div>
            </div>

            <!-- Step 2 -->
            <div class="stepper-step ${step2Class}">
              <div class="step-circle">${step2Icon}</div>
              <div class="step-name">${t('stageReview')}</div>
              <div class="step-detail">${step2Detail}</div>
            </div>

            <!-- Step 3 -->
            <div class="stepper-step ${step3Class}">
              <div class="step-circle">${step3Icon}</div>
              <div class="step-name">${t('stageDecision')}</div>
              <div class="step-detail">${step3Detail}</div>
            </div>

            <!-- Step 4 -->
            <div class="stepper-step ${step4Class}">
              <div class="step-circle">${step4Icon}</div>
              <div class="step-name">${t('stageDelivery')}</div>
              <div class="step-detail">${step4Detail}</div>
            </div>
          </div>
        </div>

        <!-- Management Feedback Callout -->
        ${feedbackBoxHtml}

        <!-- Business Purpose -->
        <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">
          ${t('purposeLabel')}:
        </div>
        <div class="req-purpose-quote">
          ${req.purpose || 'No purpose description provided.'}
        </div>

        <!-- Items Breakdown -->
        <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:6px;">
          ${t('itemsSectionTitle')} (${(req.items || []).length}):
        </div>
        <table class="card-items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>${t('colItemSelect')}</th>
              <th>${t('colQty')} & ${t('colUnit')}</th>
              <th>${t('colUnitPrice')}</th>
              <th style="text-align:right;">${t('colLineTotal')}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>

      <!-- Footer Actions -->
      <div class="req-card-footer">
        <div style="font-size:12.5px; color:var(--text-muted);">
          👤 <strong>${req.requesterName}</strong> (${req.requesterEmail || ''})
        </div>
        <div style="display:flex; align-items:center; gap:14px;">
          <div class="req-total-badge">
            <span style="font-size:12.5px; font-weight:600; color:var(--text-muted); margin-right:4px;">${t('grandTotal')}</span>
            <span>${formatCurrency(req.totalAmount)}</span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-sm btn-outline" onclick="openRequisitionDetail('${req.id}')">${t('actionView')}</button>
            <button class="btn btn-sm btn-outline" onclick="printRequisition('${req.id}')" title="${t('actionPrint')}">🖨️</button>
            ${req.status === 'rejected' ? `<button class="btn btn-sm btn-primary" onclick="cloneRequisitionToNew('${req.id}')" style="background:#be123c; border-color:#9f1239;">🔄 ${t('btnResubmitModify')}</button>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

window.cloneRequisitionToNew = function(reqId) {
  const req = AppData.getRequisitions().find(r => r.id === reqId);
  if (!req) return;

  switchTab('new-request');

  const deptSelect = document.getElementById('formDepartmentSelect');
  const prioritySelect = document.getElementById('formPrioritySelect');
  const requesterNameInput = document.getElementById('formRequesterName');
  const requesterEmailInput = document.getElementById('formRequesterEmail');
  const neededDateInput = document.getElementById('formNeededDate');
  const purposeInput = document.getElementById('formPurposeText');

  if (deptSelect) deptSelect.value = req.department;
  if (prioritySelect) prioritySelect.value = req.priority;
  if (requesterNameInput) requesterNameInput.value = req.requesterName;
  if (requesterEmailInput) requesterEmailInput.value = req.requesterEmail;
  if (neededDateInput) neededDateInput.value = req.neededDate || '';
  if (purposeInput) {
    purposeInput.value = `[Re-submission of ${req.id}] ${req.purpose || ''}`;
  }

  // Populate line items
  const tbody = document.getElementById('lineItemsTbody');
  if (tbody) {
    tbody.innerHTML = '';
    lineItemCounter = 0;
    if (req.items && req.items.length > 0) {
      req.items.forEach(item => {
        addLineItemRow(item);
      });
    } else {
      addLineItemRow();
    }
    updateGrandTotal();
  }

  showToast(t('cloneToastSuccess'), 'success');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

