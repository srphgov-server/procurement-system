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
  editingUserId: null,
  editingRequisitionId: null
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
  initApprovedListListeners();
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

  // If editing an existing requisition, re-apply edit labels
  if (AppState.editingRequisitionId) {
    const headingEl = document.getElementById('formViewHeading');
    const subheadEl = document.getElementById('formViewSubheading');
    const submitTextEl = document.getElementById('submitRequisitionText');
    if (headingEl) headingEl.textContent = `${t('editFormTitle')} [${AppState.editingRequisitionId}]`;
    if (subheadEl) subheadEl.textContent = t('editFormSubtitle');
    if (submitTextEl) submitTextEl.textContent = t('btnUpdateRequest');
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
  const activeNav = document.querySelectorAll(`[data-nav-target="${tab}"]`);
  activeNav.forEach(el => el.classList.add('active'));

  // Toggle view visibility
  document.querySelectorAll('.tab-view').forEach(view => {
    view.style.display = view.id === `view-${tab}` ? 'block' : 'none';
  });

  // Update Dynamics 365 Command Bar Breadcrumb
  const breadcrumbEl = document.getElementById('d365BreadcrumbCurrent');
  if (breadcrumbEl) {
    const tabMap = {
      'dashboard': t('requisitionList') || 'Requisitions',
      'requester-dashboard': t('requesterDashboardTitle') || 'Requester Portal',
      'approved-list': t('approvedListTitle') || 'Approved Allocations',
      'new-request': t('formTitle') || 'New Requisition',
      'departments': t('deptManagementTitle') || 'Requesting Departments',
      'priorities': t('prioManagementTitle') || 'Priority Levels',
      'categories': t('catManagementTitle') || 'Categories',
      'items': t('itemManagementTitle') || 'Item Catalog',
      'users': t('userManagementTitle') || 'Users'
    };
    breadcrumbEl.textContent = tabMap[tab] || tab;
  }

  // If opening request form, refresh catalog options and reset line items
  if (tab === 'new-request') {
    populateDepartmentSelect();
    populateFilterDropdowns();
    if (!AppState.editingRequisitionId) {
      resetRequisitionFormUI();
    }
  } else {
    // Navigating away from requisition form clears editing mode
    if (AppState.editingRequisitionId) {
      AppState.editingRequisitionId = null;
    }
  }

  renderCurrentTabView();
}

window.toggleSidebarCollapse = function() {
  document.body.classList.toggle('sidebar-collapsed');
};

window.toggleFastTab = function(headerEl) {
  const fasttab = headerEl.closest('.d365-fasttab');
  if (fasttab) {
    fasttab.classList.toggle('open');
  }
};

function updateSitemapBadges() {
  const requisitions = AppData.getRequisitions();
  const approvedCount = requisitions.filter(r => r.status === 'approved' || r.status === 'completed').length;
  const badge = document.getElementById('sitemapApprovedBadge');
  if (badge) {
    badge.textContent = approvedCount;
    badge.style.display = approvedCount > 0 ? 'inline-block' : 'none';
  }
}

function renderAll() {
  updateLanguageUI();
  updateRoleVisibility();
  populateFilterDropdowns();
  populateDepartmentSelect();
  renderKPIs();
  renderPriorityPills();
  updateSitemapBadges();
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
    case 'approved-list':
      renderApprovedListView();
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
          <div style="margin-bottom: 8px;"><span class="material-symbols-outlined" style="font-size:36px; color:#94a3b8;">assignment</span></div>
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
            ${req.status === 'new' ? `<button class="btn btn-sm btn-outline-primary" onclick="openEditRequisition('${req.id}')" title="${t('actionEdit')}"><span class="material-symbols-outlined" style="font-size:15px;">edit</span></button>` : ''}
            <button class="btn btn-sm btn-outline" onclick="printRequisition('${req.id}')" title="${t('actionPrint')}"><span class="material-symbols-outlined" style="font-size:15px;">print</span></button>
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
      return `<span class="badge badge-status-new"><span class="material-symbols-outlined" style="font-size:12px; margin-right:3px; vertical-align:middle;">fiber_manual_record</span>${t('statusNew')}</span>`;
    case 'under_review':
      return `<span class="badge badge-status-under_review"><span class="material-symbols-outlined" style="font-size:13px; margin-right:3px; vertical-align:middle;">schedule</span>${t('statusUnderReview')}</span>`;
    case 'approved':
      return `<span class="badge badge-status-approved"><span class="material-symbols-outlined" style="font-size:13px; margin-right:3px; vertical-align:middle;">check</span>${t('statusApproved')}</span>`;
    case 'rejected':
      return `<span class="badge badge-status-rejected"><span class="material-symbols-outlined" style="font-size:13px; margin-right:3px; vertical-align:middle;">close</span>${t('statusRejected')}</span>`;
    case 'completed':
      return `<span class="badge badge-status-completed"><span class="material-symbols-outlined" style="font-size:13px; margin-right:3px; vertical-align:middle;">done_all</span>${t('statusCompleted')}</span>`;
    default:
      return `<span class="badge">${status}</span>`;
  }
}

// Requisition Form Mode & Workflow Helpers
window.startNewRequisition = function() {
  AppState.editingRequisitionId = null;
  switchTab('new-request');
  resetRequisitionFormUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.cancelRequisitionForm = function() {
  AppState.editingRequisitionId = null;
  resetRequisitionFormUI();
  switchTab('requester-dashboard');
};

window.resetRequisitionFormUI = function() {
  AppState.editingRequisitionId = null;
  const headingEl = document.getElementById('formViewHeading');
  const subheadEl = document.getElementById('formViewSubheading');
  const submitTextEl = document.getElementById('submitRequisitionText');
  const submitIconEl = document.getElementById('submitRequisitionIcon');

  if (headingEl) headingEl.textContent = t('formTitle');
  if (subheadEl) subheadEl.textContent = t('formSubtitle');
  if (submitTextEl) submitTextEl.textContent = t('btnSubmitRequest');
  if (submitIconEl) submitIconEl.textContent = 'send';

  const form = document.getElementById('newRequisitionForm');
  if (form) form.reset();

  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('formRequestDate');
  if (dateInput) dateInput.value = today;

  populateDepartmentSelect();
  populateFilterDropdowns();
  resetLineItemsTable();
};

window.openEditRequisition = function(reqId) {
  const req = AppData.getRequisitions().find(r => r.id === reqId);
  if (!req) return;

  // Strict check: Edit is ONLY available if transaction is still in 'new' status
  if (req.status !== 'new') {
    showToast(t('editLockedWarning') || 'Cannot edit: Transaction has already been reviewed or approved.', 'warning');
    return;
  }

  AppState.editingRequisitionId = reqId;

  // Switch to new-request tab (without resetting line items)
  switchTab('new-request');

  const headingEl = document.getElementById('formViewHeading');
  const subheadEl = document.getElementById('formViewSubheading');
  const submitTextEl = document.getElementById('submitRequisitionText');
  const submitIconEl = document.getElementById('submitRequisitionIcon');

  if (headingEl) headingEl.textContent = `${t('editFormTitle')} [${req.id}]`;
  if (subheadEl) subheadEl.textContent = t('editFormSubtitle');
  if (submitTextEl) submitTextEl.textContent = t('btnUpdateRequest');
  if (submitIconEl) submitIconEl.textContent = 'save';

  const deptSelect = document.getElementById('formDepartmentSelect');
  const prioritySelect = document.getElementById('formPrioritySelect');
  const requesterNameInput = document.getElementById('formRequesterName');
  const requesterEmailInput = document.getElementById('formRequesterEmail');
  const requestDateInput = document.getElementById('formRequestDate');
  const neededDateInput = document.getElementById('formNeededDate');
  const purposeInput = document.getElementById('formPurposeText');

  if (deptSelect) deptSelect.value = req.department;
  if (prioritySelect) prioritySelect.value = req.priority;
  if (requesterNameInput) requesterNameInput.value = req.requesterName;
  if (requesterEmailInput) requesterEmailInput.value = req.requesterEmail || '';
  if (requestDateInput) requestDateInput.value = req.requestDate || new Date().toISOString().split('T')[0];
  if (neededDateInput) neededDateInput.value = req.neededDate || '';
  if (purposeInput) purposeInput.value = req.purpose || '';

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

  showToast(AppState.lang === 'kh' ? `បានទាញយកទិន្នន័យ ${req.id} ដើម្បីកែសម្រួល` : `Editing ${req.id} (Status: New)`, 'info');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

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
      cancelRequisitionForm();
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
      <button type="button" class="btn btn-sm btn-text" onclick="removeLineItemRow('${rowId}')" title="${t('actionDelete')}"><span class="material-symbols-outlined" style="font-size:16px; color:#ef4444;">delete</span></button>
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
  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

  if (AppState.editingRequisitionId) {
    // EDIT EXISTING REQUISITION
    const existingReq = requisitions.find(r => r.id === AppState.editingRequisitionId);
    if (!existingReq) {
      showToast('Requisition record not found.', 'danger');
      return;
    }

    if (existingReq.status !== 'new') {
      showToast(t('editLockedWarning') || 'Cannot edit: Transaction has already been reviewed or approved.', 'warning');
      return;
    }

    existingReq.department = dept;
    existingReq.priority = priority;
    existingReq.requesterName = requesterName;
    existingReq.requesterEmail = requesterEmail;
    existingReq.requestDate = requestDate || existingReq.requestDate;
    existingReq.neededDate = neededDate || '';
    existingReq.purpose = purpose;
    existingReq.items = items;
    existingReq.totalAmount = totalAmount;

    if (!existingReq.history) existingReq.history = [];
    existingReq.history.push({
      action: 'Updated',
      byRole: 'requester',
      byUser: requesterName,
      timestamp: new Date().toLocaleString(),
      comment: 'Requisition details & line items updated while in New status'
    });

    AppData.saveRequisitions(requisitions);

    const updatedId = existingReq.id;
    AppState.editingRequisitionId = null;
    resetRequisitionFormUI();

    showToast(`${t('reqUpdatedSuccess')} ${updatedId}`, 'success');

    // Make sure newly updated requisition is visible in Requester Dashboard
    AppState.requesterPersona = 'all';
    AppState.requesterSituation = 'all';

    switchTab('requester-dashboard');
    renderAll();
  } else {
    // CREATE NEW REQUISITION
    const nextNumber = requisitions.length + 1;
    const newId = `REQ-2026-${String(nextNumber).padStart(3, '0')}`;

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

    resetRequisitionFormUI();
    showToast(`${t('reqSubmittedSuccess')} ${newId}`, 'success');

    // Make sure newly created requisition is visible in Requester Dashboard
    AppState.requesterPersona = 'all';
    AppState.requesterSituation = 'all';

    // Switch to requester-dashboard in view-only list
    switchTab('requester-dashboard');
    renderAll();
  }
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

  // Build items table (Requested Items Breakdown)
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

  // Build Approved Allocation Breakdown Section (Bottom of Requested Items Breakdown)
  let approvedSectionHtml = '';
  const isApprovedOrCompleted = req.status === 'approved' || req.status === 'completed';
  const isPendingReview = req.status === 'new' || req.status === 'under_review';
  const canManageApproval = (AppState.role === 'management' || AppState.role === 'admin');

  if (canManageApproval && isPendingReview) {
    // Interactive Management Allocation Form
    const rowsHtml = req.items.map((item, idx) => {
      const initApprovedQty = item.approvedQty !== undefined ? item.approvedQty : item.qty;
      const initApprovedSubtotal = Number((initApprovedQty * item.unitPrice).toFixed(2));
      return `
        <tr class="approved-item-row" data-index="${idx}" data-unit-price="${item.unitPrice}" data-max-qty="${item.qty}">
          <td style="font-weight:700; width:40px;">#${idx + 1}</td>
          <td>
            <div style="font-weight:700; color:var(--d365-text-primary);">${item.itemName}</div>
            <div style="font-size:12px; color:var(--text-light);">${item.spec || '-'}</div>
          </td>
          <td style="width:125px;">
            <span class="badge" style="background:#f1f5f9; font-size:12px; color:#334155; font-weight:600;">
              ${item.qty} ${item.unit}
            </span>
          </td>
          <td style="width:160px;">
            <div class="d-flex align-items-center gap-1">
              <input type="number" 
                     id="approvedQtyInput_${idx}" 
                     class="form-control form-control-sm text-center fw-bold approved-qty-field" 
                     style="width:85px; border-color:#107c41; font-size:13px;"
                     min="0" 
                     max="${item.qty}" 
                     step="1"
                     value="${initApprovedQty}" 
                     oninput="recalcApprovalSubtotals('${req.id}')" />
              <span class="small text-muted">${item.unit}</span>
            </div>
            <small class="text-muted" style="font-size:10.5px;">Max: ${item.qty} ${item.unit}</small>
          </td>
          <td style="width:110px; font-weight:600;">${formatCurrency(item.unitPrice)}</td>
          <td style="width:130px; text-align:right; font-weight:700; color:#107c41;" id="approvedSubtotalSpan_${idx}">
            ${formatCurrency(initApprovedSubtotal)}
          </td>
          <td style="width:140px; text-align:center;" id="allocationStatusBadge_${idx}">
            ${initApprovedQty === item.qty 
              ? `<span class="badge" style="background:#dff6dd; color:#107c41; border:1px solid #92c353;">100% Full</span>`
              : (initApprovedQty > 0 
                ? `<span class="badge" style="background:#fed9cc; color:#d83b01; border:1px solid #ea6100;">Partial (-${item.qty - initApprovedQty})</span>`
                : `<span class="badge" style="background:#fde7e9; color:#a80000; border:1px solid #d13438;">0 Excluded</span>`)}
          </td>
        </tr>
      `;
    }).join('');

    const currentApprovedTotal = (req.items || []).reduce((acc, itm) => {
      const q = itm.approvedQty !== undefined ? itm.approvedQty : itm.qty;
      return acc + (q * itm.unitPrice);
    }, 0);
    const variance = currentApprovedTotal - req.totalAmount;

    approvedSectionHtml = `
      <div class="card mb-4 border" style="border-color:#107c41 !important; background:#ffffff; box-shadow:0 2px 8px rgba(16,124,65,0.08);">
        <div class="card-header bg-light d-flex justify-content-between align-items-center py-2 px-3" style="border-bottom:1px solid #c7e0f4;">
          <div class="d-flex align-items-center gap-1">
            <span class="material-symbols-outlined" style="font-size:19px; color:#107c41; vertical-align:middle;">fact_check</span>
            <strong style="color:#107c41; font-size:14px;">${t('sectionApprovedBreakdown')}</strong>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm btn-outline-success" onclick="setAllApprovedQty('${req.id}', 1)">
              <span class="material-symbols-outlined" style="font-size:14px; margin-right:2px;">done_all</span> ${t('btnSetAll100')}
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setAllApprovedQty('${req.id}', 0)">
              <span class="material-symbols-outlined" style="font-size:14px; margin-right:2px;">clear_all</span> ${t('btnClearAll0')}
            </button>
          </div>
        </div>
        <div class="card-body p-3">
          <p class="text-secondary small mb-3">
            <span class="material-symbols-outlined text-success" style="font-size:15px; vertical-align:middle; margin-right:3px;">info</span>
            ${t('approvedBreakdownDesc')}
          </p>

          <div class="table-responsive">
            <table class="table table-bordered table-sm align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width:40px;">#</th>
                  <th>${t('colItemSelect')}</th>
                  <th style="width:125px;">${t('colQty')} (Req)</th>
                  <th style="width:160px; color:#107c41;">${t('colApprovedQty')}</th>
                  <th style="width:110px;">${t('colUnitPrice')}</th>
                  <th style="text-align:right; width:130px; color:#107c41;">${t('colApprovedSubtotal')}</th>
                  <th style="text-align:center; width:140px;">${t('colAllocationStatus')}</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
              <tfoot class="table-light">
                <tr style="font-weight:700;">
                  <td colspan="4" class="text-end text-secondary small">${t('totalRequestedBudget')}: <strong>${formatCurrency(req.totalAmount)}</strong></td>
                  <td class="text-end" style="color:#107c41;">${t('totalApprovedBudget')}:</td>
                  <td class="text-end" style="font-size:15px; color:#107c41;" id="approvalModalApprovedTotal">${formatCurrency(currentApprovedTotal)}</td>
                  <td class="text-center" id="approvalModalVariance">
                    <span class="badge ${variance >= 0 ? 'bg-success' : 'bg-warning text-dark'}" style="font-size:11px;">
                      ${variance >= 0 ? 'Match (100%)' : formatCurrency(variance)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Allocation Rationale & Submit Button -->
          <div class="mt-3 pt-3 border-top d-flex flex-column flex-md-row gap-3 justify-content-between align-items-md-center">
            <div class="flex-grow-1">
              <label class="form-label small fw-bold text-secondary mb-1" for="approvalRationaleInput">
                ${t('mgmtAllocationNotes')}
              </label>
              <input type="text" id="approvalRationaleInput" class="form-control form-control-sm" 
                     placeholder="${t('mgmtAllocationPlaceholder')}" 
                     value="${req.remarks || ''}" />
            </div>
            <div class="text-end align-self-md-end">
              <button type="button" class="btn btn-success d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm" onclick="submitManagementApproval('${req.id}')">
                <span class="material-symbols-outlined" style="font-size:18px;">task_alt</span>
                <span class="fw-bold">${t('btnSubmitApproval')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (isApprovedOrCompleted) {
    // Read-only Approved Allocation Breakdown
    const rowsHtml = req.items.map((item, idx) => {
      const appQty = item.approvedQty !== undefined ? item.approvedQty : item.qty;
      const appSubtotal = item.approvedSubtotal !== undefined ? item.approvedSubtotal : item.subtotal;
      const isFull = appQty === item.qty;
      const isZero = appQty === 0;

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <div style="font-weight:700;">${item.itemName}</div>
            <div style="font-size:12px; color:var(--text-light);">${item.spec || '-'}</div>
          </td>
          <td>${item.qty} ${item.unit}</td>
          <td>
            <strong style="color:#107c41; font-size:13.5px;">${appQty}</strong> <span class="text-muted small">${item.unit}</span>
          </td>
          <td>${formatCurrency(item.unitPrice)}</td>
          <td style="text-align:right; font-weight:700; color:#107c41;">${formatCurrency(appSubtotal)}</td>
          <td style="text-align:center;">
            ${isFull 
              ? `<span class="badge" style="background:#dff6dd; color:#107c41; border:1px solid #92c353;">100% Full</span>` 
              : (isZero 
                ? `<span class="badge" style="background:#fde7e9; color:#a80000; border:1px solid #d13438;">0 Excluded</span>` 
                : `<span class="badge" style="background:#fed9cc; color:#d83b01; border:1px solid #ea6100;">Limited (-${item.qty - appQty})</span>`)}
          </td>
        </tr>
      `;
    }).join('');

    const approvedTotal = req.approvedTotal !== undefined ? req.approvedTotal : req.totalAmount;
    const diff = approvedTotal - req.totalAmount;

    approvedSectionHtml = `
      <div class="card mb-4 border" style="border-color:#107c41 !important; background:#ffffff;">
        <div class="card-header d-flex justify-content-between align-items-center py-2 px-3" style="background:#dff6dd; border-bottom:1px solid #92c353;">
          <div class="d-flex align-items-center gap-2">
            <span class="material-symbols-outlined text-success" style="font-size:20px;">verified</span>
            <strong style="color:#107c41; font-size:14px;">${t('sectionApprovedBreakdown')}</strong>
            <span class="badge ${req.approvalType === 'partial' ? 'bg-warning text-dark' : 'bg-success'} ms-1">
              ${req.approvalType === 'partial' ? t('approvalTypePartial') : t('approvalTypeFull')}
            </span>
          </div>
          <small class="text-secondary">
            ${t('approvedByLabel')}: <strong>${req.approvedBy || 'Management / Admin'}</strong> (${req.approvedDate || req.requestDate})
          </small>
        </div>
        <div class="card-body p-3">
          <div class="table-responsive">
            <table class="table table-bordered table-sm align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width:40px;">#</th>
                  <th>${t('colItemSelect')}</th>
                  <th style="width:125px;">${t('colQty')} (Req)</th>
                  <th style="width:140px; color:#107c41;">${t('colApprovedQty')}</th>
                  <th style="width:110px;">${t('colUnitPrice')}</th>
                  <th style="text-align:right; width:130px; color:#107c41;">${t('colApprovedSubtotal')}</th>
                  <th style="text-align:center; width:140px;">${t('colAllocationStatus')}</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
              <tfoot class="table-light">
                <tr style="font-weight:700;">
                  <td colspan="4" class="text-end text-secondary small">${t('totalRequestedBudget')}: <strong>${formatCurrency(req.totalAmount)}</strong></td>
                  <td class="text-end" style="color:#107c41;">${t('totalApprovedBudget')}:</td>
                  <td class="text-end" style="font-size:16px; color:#107c41;">${formatCurrency(approvedTotal)}</td>
                  <td class="text-center">
                    <span class="badge ${diff === 0 ? 'bg-success' : 'bg-warning text-dark'}">
                      ${diff === 0 ? '100% Matched' : formatCurrency(diff)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          ${req.remarks ? `
            <div class="mt-2 p-2 bg-light rounded border small">
              <strong>${t('mgmtRemarksTitle')}:</strong> ${req.remarks}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  } else if (isPendingReview && AppState.role === 'requester') {
    // Requester view awaiting management allocation
    approvedSectionHtml = `
      <div class="alert alert-info d-flex align-items-center gap-2 mb-4 py-2 px-3">
        <span class="material-symbols-outlined text-primary" style="font-size:20px;">pending_actions</span>
        <span class="small">${t('awaitingMgmtAllocation')}</span>
      </div>
    `;
  }

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
        <button class="btn btn-warning" onclick="updateReqStatus('${req.id}', 'under_review')">${t('btnConfirmReview')}</button>
        <button class="btn btn-success" onclick="submitManagementApproval('${req.id}')">${t('btnConfirmApprove')}</button>
      `;
    } else if (AppState.role === 'admin') {
      actionButtons = `
        <button class="btn btn-warning" onclick="updateReqStatus('${req.id}', 'under_review')">${t('btnConfirmReview')}</button>
        <button class="btn btn-success" onclick="submitManagementApproval('${req.id}')">${t('btnConfirmApprove')}</button>
        <button class="btn btn-danger" onclick="updateReqStatus('${req.id}', 'rejected')">${t('btnConfirmReject')}</button>
        <button class="btn btn-outline" onclick="updateReqStatus('${req.id}', 'completed')">${t('btnConfirmComplete')}</button>
      `;
    }

    actionPanelHtml = `
      <div class="action-panel-box">
        <h4><span class="material-symbols-outlined" style="font-size:20px; vertical-align:middle; margin-right:4px; color:#2563eb;">bolt</span>${t('sectionManagementActions')} (${getRoleName(AppState.role)})</h4>
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

  // Calculate Dynamics 365 BPF Stages
  let bpfStage1 = 'completed';
  let bpfStage2 = 'pending';
  let bpfStage3 = 'pending';
  let bpfStage4 = 'pending';
  let bpfStage1Status = req.requestDate || 'Drafted';
  let bpfStage2Status = AppState.lang === 'kh' ? 'ក្នុងជួរពិនិត្យ' : 'In Review Queue';
  let bpfStage3Status = AppState.lang === 'kh' ? 'រង់ចាំការសម្រេច' : 'Pending Decision';
  let bpfStage4Status = AppState.lang === 'kh' ? 'រង់ចាំការអនុម័ត' : 'PO Issuance';

  if (req.status === 'new') {
    bpfStage1 = 'completed';
    bpfStage2 = 'active';
    bpfStage2Status = AppState.lang === 'kh' ? 'រង់ចាំការត្រួតពិនិត្យ' : 'Pending Review';
    bpfStage3 = 'pending';
    bpfStage4 = 'pending';
  } else if (req.status === 'under_review') {
    bpfStage1 = 'completed';
    bpfStage2 = 'active';
    bpfStage2Status = AppState.lang === 'kh' ? 'កំពុងត្រួតពិនិត្យជាក់ស្តែង' : 'Active Review';
    bpfStage3 = 'pending';
    bpfStage4 = 'pending';
  } else if (req.status === 'approved') {
    bpfStage1 = 'completed';
    bpfStage2 = 'completed';
    bpfStage2Status = AppState.lang === 'kh' ? 'បានពិនិត្យ ✓' : 'Reviewed ✓';
    bpfStage3 = 'completed';
    bpfStage3Status = AppState.lang === 'kh' ? 'បានអនុម័ត ✓' : 'Approved ✓';
    bpfStage4 = 'active';
    bpfStage4Status = AppState.lang === 'kh' ? 'កំពុងដំណើរការបញ្ជាទិញ' : 'PO Processing';
  } else if (req.status === 'rejected') {
    bpfStage1 = 'completed';
    bpfStage2 = 'completed';
    bpfStage2Status = AppState.lang === 'kh' ? 'បានពិនិត្យ' : 'Reviewed';
    bpfStage3 = 'declined';
    bpfStage3Status = AppState.lang === 'kh' ? 'បានបដិសេធ ✕' : 'Declined ✕';
    bpfStage4 = 'pending';
    bpfStage4Status = AppState.lang === 'kh' ? 'ផ្អាកបញ្ជាទិញ' : 'Halted';
  } else if (req.status === 'completed') {
    bpfStage1 = 'completed';
    bpfStage2 = 'completed';
    bpfStage2Status = AppState.lang === 'kh' ? 'បានពិនិត្យ ✓' : 'Reviewed ✓';
    bpfStage3 = 'completed';
    bpfStage3Status = AppState.lang === 'kh' ? 'បានអនុម័ត ✓' : 'Approved ✓';
    bpfStage4 = 'completed';
    bpfStage4Status = AppState.lang === 'kh' ? 'បានប្រគល់ទំនិញ ★' : 'Delivered ★';
  }

  const bpfStage1Title = t('stageBpf1') || '1. Draft & Submit';
  const stage2Title = t('stageBpf2') || '2. Management Review';
  const stage3Title = t('stageBpf3') || '3. Approval Decision';
  const stage4Title = t('stageBpf4') || '4. Sourcing & Delivery';

  const bpfHtml = `
    <div class="d365-bpf-container mb-3">
      <div class="d365-bpf-bar">
        <div class="d365-bpf-stage ${bpfStage1}">
          <span class="d365-bpf-stage-title"><span class="material-symbols-outlined" style="font-size:16px; margin-right:4px;">edit_document</span> ${bpfStage1Title}</span>
          <span class="d365-bpf-stage-status">${bpfStage1Status}</span>
        </div>
        <div class="d365-bpf-stage ${bpfStage2}">
          <span class="d365-bpf-stage-title"><span class="material-symbols-outlined" style="font-size:16px; margin-right:4px;">rate_review</span> ${stage2Title}</span>
          <span class="d365-bpf-stage-status">${bpfStage2Status}</span>
        </div>
        <div class="d365-bpf-stage ${bpfStage3}">
          <span class="d365-bpf-stage-title"><span class="material-symbols-outlined" style="font-size:16px; margin-right:4px;">gavel</span> ${stage3Title}</span>
          <span class="d365-bpf-stage-status">${bpfStage3Status}</span>
        </div>
        <div class="d365-bpf-stage ${bpfStage4}">
          <span class="d365-bpf-stage-title"><span class="material-symbols-outlined" style="font-size:16px; margin-right:4px;">local_shipping</span> ${stage4Title}</span>
          <span class="d365-bpf-stage-status">${bpfStage4Status}</span>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = `
    <!-- Print-only header -->
    <div class="print-only-header">
      <h2>PROCUREMENT REQUISITION ORDER</h2>
      <p>Company Procurement Department | Official Purchase Request Voucher</p>
      <hr style="margin: 15px 0;" />
    </div>

    <!-- Dynamics 365 Business Process Flow Chevron Gate -->
    ${bpfHtml}

    <!-- General Info Grid -->
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; background:#f8fafc; padding:16px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:20px;">
      <div>
        <div style="font-size:12px; color:var(--text-muted);">${t('thReqId')}</div>
        <div style="font-size:18px; font-weight:800; color:var(--primary); font-family:monospace;">${req.id}</div>
      </div>
      <div>
        <div style="font-size:12px; color:var(--text-muted);">${t('thStatus')}</div>
        <div class="d-flex align-items-center gap-2">
          ${getStatusBadge(req.status)}
          ${req.status === 'new' 
            ? `<button type="button" class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-0 px-2" onclick="closeModal('requisitionDetailModal'); openEditRequisition('${req.id}');" style="font-size:11.5px; height:24px;">
                 <span class="material-symbols-outlined" style="font-size:14px;">edit</span>
                 <span>${t('actionEdit')}</span>
               </button>`
            : `<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle d-inline-flex align-items-center gap-1" style="font-size:10.5px; padding:3px 6px;" title="${t('editLockedTooltip')}">
                 <span class="material-symbols-outlined" style="font-size:12px;">lock</span>
                 <span>${t('editLockedBadge')}</span>
               </span>`
          }
        </div>
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

    <!-- Items Table (Requested Items Breakdown) -->
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

    <!-- Approved List in the bottom of Requested Items Breakdown -->
    ${approvedSectionHtml}

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

  // Update Modal Footer with Edit action if status === 'new'
  const modalFooter = document.getElementById('requisitionDetailModalFooter');
  if (modalFooter) {
    if (req.status === 'new') {
      modalFooter.innerHTML = `
        <div class="d-flex justify-content-between align-items-center w-100 flex-wrap gap-2">
          <div class="text-muted small d-flex align-items-center gap-1">
            <span class="material-symbols-outlined text-primary" style="font-size:17px;">edit_document</span>
            <span>${AppState.lang === 'kh' ? 'ស្ថានភាពថ្មី៖ អ្នកអាចកែសម្រួលសំណើនេះបាន' : 'Status is New: You can edit this requisition before review.'}</span>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-warning d-inline-flex align-items-center gap-1 shadow-sm px-3" onclick="closeModal('requisitionDetailModal'); openEditRequisition('${req.id}');">
              <span class="material-symbols-outlined" style="font-size:17px;">edit</span>
              <span class="fw-bold">${t('actionEditRequisition')}</span>
            </button>
            <button type="button" class="btn btn-outline d-inline-flex align-items-center gap-1" onclick="printRequisition('${req.id}')">
              <span class="material-symbols-outlined" style="font-size:16px;">print</span> <span>${t('actionPrint')}</span>
            </button>
            <button type="button" class="btn btn-secondary" onclick="closeModal('requisitionDetailModal')">${t('actionClose')}</button>
          </div>
        </div>
      `;
    } else {
      modalFooter.innerHTML = `
        <div class="d-flex justify-content-between align-items-center w-100 flex-wrap gap-2">
          <div class="text-muted small d-flex align-items-center gap-1">
            <span class="material-symbols-outlined text-secondary" style="font-size:17px;">lock</span>
            <span title="${t('editLockedTooltip')}">${t('editLockedTooltip')}</span>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-secondary disabled d-inline-flex align-items-center gap-1" disabled style="opacity:0.6; cursor:not-allowed;" title="${t('editLockedTooltip')}">
              <span class="material-symbols-outlined" style="font-size:16px;">lock</span>
              <span>${t('actionEditLocked')}</span>
            </button>
            <button type="button" class="btn btn-outline d-inline-flex align-items-center gap-1" onclick="printRequisition('${req.id}')">
              <span class="material-symbols-outlined" style="font-size:16px;">print</span> <span>${t('actionPrint')}</span>
            </button>
            <button type="button" class="btn btn-primary" onclick="closeModal('requisitionDetailModal')">${t('actionClose')}</button>
          </div>
        </div>
      `;
    }
  }

  modal.classList.add('open');
};

window.recalcApprovalSubtotals = function(reqId) {
  const req = AppData.getRequisitions().find(r => r.id === reqId);
  if (!req) return;

  const rows = document.querySelectorAll('.approved-item-row');
  let runningApprovedTotal = 0;

  rows.forEach(row => {
    const idx = parseInt(row.getAttribute('data-index'), 10);
    const unitPrice = parseFloat(row.getAttribute('data-unit-price')) || 0;
    const maxQty = parseFloat(row.getAttribute('data-max-qty')) || 0;
    const input = document.getElementById(`approvedQtyInput_${idx}`);
    if (!input) return;

    let val = parseFloat(input.value);
    if (isNaN(val) || val < 0) {
      val = 0;
    }
    if (val > maxQty) {
      val = maxQty;
      input.value = maxQty;
    }

    const subtotal = Number((val * unitPrice).toFixed(2));
    runningApprovedTotal += subtotal;

    const span = document.getElementById(`approvedSubtotalSpan_${idx}`);
    if (span) span.textContent = formatCurrency(subtotal);

    const badge = document.getElementById(`allocationStatusBadge_${idx}`);
    if (badge) {
      if (val === maxQty) {
        badge.innerHTML = `<span class="badge" style="background:#dff6dd; color:#107c41; border:1px solid #92c353;">100% Full</span>`;
      } else if (val > 0) {
        badge.innerHTML = `<span class="badge" style="background:#fed9cc; color:#d83b01; border:1px solid #ea6100;">Partial (-${maxQty - val})</span>`;
      } else {
        badge.innerHTML = `<span class="badge" style="background:#fde7e9; color:#a80000; border:1px solid #d13438;">0 Excluded</span>`;
      }
    }
  });

  const totalEl = document.getElementById('approvalModalApprovedTotal');
  if (totalEl) totalEl.textContent = formatCurrency(runningApprovedTotal);

  const varEl = document.getElementById('approvalModalVariance');
  if (varEl) {
    const diff = runningApprovedTotal - req.totalAmount;
    if (Math.abs(diff) < 0.01) {
      varEl.innerHTML = `<span class="badge bg-success" style="font-size:11px;">Match (100%)</span>`;
    } else {
      varEl.innerHTML = `<span class="badge bg-warning text-dark" style="font-size:11px;">${formatCurrency(diff)}</span>`;
    }
  }
};

window.setAllApprovedQty = function(reqId, factor) {
  const rows = document.querySelectorAll('.approved-item-row');
  rows.forEach(row => {
    const idx = parseInt(row.getAttribute('data-index'), 10);
    const maxQty = parseFloat(row.getAttribute('data-max-qty')) || 0;
    const input = document.getElementById(`approvedQtyInput_${idx}`);
    if (input) {
      input.value = factor === 1 ? maxQty : 0;
    }
  });
  recalcApprovalSubtotals(reqId);
};

window.submitManagementApproval = function(reqId) {
  const requisitions = AppData.getRequisitions();
  const req = requisitions.find(r => r.id === reqId);
  if (!req) return;

  const rows = document.querySelectorAll('.approved-item-row');
  let newApprovedTotal = 0;
  let anyReduced = false;

  if (rows.length > 0) {
    rows.forEach(row => {
      const idx = parseInt(row.getAttribute('data-index'), 10);
      const input = document.getElementById(`approvedQtyInput_${idx}`);
      const maxQty = req.items[idx].qty;
      let val = input ? parseFloat(input.value) : maxQty;
      if (isNaN(val) || val < 0) val = 0;
      if (val > maxQty) val = maxQty;

      req.items[idx].approvedQty = val;
      req.items[idx].approvedSubtotal = Number((val * req.items[idx].unitPrice).toFixed(2));
      newApprovedTotal += req.items[idx].approvedSubtotal;

      if (val < maxQty) anyReduced = true;
    });
  } else {
    // If no row inputs were active, default to full
    req.items.forEach(itm => {
      if (itm.approvedQty === undefined) itm.approvedQty = itm.qty;
      itm.approvedSubtotal = Number((itm.approvedQty * itm.unitPrice).toFixed(2));
      newApprovedTotal += itm.approvedSubtotal;
    });
  }

  req.approvedTotal = Number(newApprovedTotal.toFixed(2));
  req.approvalType = (req.approvedTotal === req.totalAmount) ? 'full' : (req.approvedTotal > 0 ? 'partial' : 'zero');
  req.status = 'approved';
  req.approvedDate = new Date().toISOString().split('T')[0];
  req.approvedBy = AppState.role === 'admin' ? 'Sokha Chan (Administrator)' : 'Vireak Vong (Management Reviewer)';

  const rationaleInput = document.getElementById('approvalRationaleInput') || document.getElementById('actionRemarkInput');
  const remarks = rationaleInput ? rationaleInput.value.trim() : '';
  req.remarks = remarks || (anyReduced 
    ? `Approved with quantity allocation adjustments (Total: ${formatCurrency(req.approvedTotal)}).` 
    : `Approved 100% requested quantities (Total: ${formatCurrency(req.approvedTotal)}).`);

  if (!req.history) req.history = [];
  req.history.push({
    action: anyReduced ? 'Approved (Adjusted)' : 'Approved (Full)',
    byRole: AppState.role,
    byUser: req.approvedBy,
    timestamp: new Date().toLocaleString(),
    comment: req.remarks
  });

  AppData.saveRequisitions(requisitions);
  showToast(AppState.lang === 'kh' ? `សំណើ ${req.id} ត្រូវបានអនុម័តបរិមាណដោយជោគជ័យ!` : `Requisition ${req.id} approved with item allocations!`, 'success');
  closeModal('requisitionDetailModal');
  renderAll();
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
};

window.updateReqStatus = function(reqId, newStatus) {
  const remarkInput = document.getElementById('actionRemarkInput') || document.getElementById('approvalRationaleInput');
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

// =========================================================================
// Team Management: Approved Allocations View
// =========================================================================
function populateApprovedFilterDropdowns() {
  const deptSelect = document.getElementById('approvedFilterDept');
  if (!deptSelect) return;
  const currentVal = deptSelect.value;
  const depts = AppData.getDepartments();
  deptSelect.innerHTML = `<option value="all">${t('allDepartments')}</option>` +
    depts.map(d => `<option value="${d.id}">${AppState.lang === 'kh' ? (d.nameKh || d.nameEn) : (d.nameEn || d.nameKh)}</option>`).join('');
  if (currentVal) deptSelect.value = currentVal;
}

window.filterApprovedByKpi = function(kpiType) {
  const statusSelect = document.getElementById('approvedFilterStatus');
  const typeSelect = document.getElementById('approvedFilterType');
  const cards = document.querySelectorAll('#approvedKpiRow .d365-kpi-card');
  cards.forEach(c => c.classList.remove('active-filter'));

  if (kpiType === 'all') {
    if (statusSelect) statusSelect.value = 'all';
    if (typeSelect) typeSelect.value = 'all';
    document.getElementById('approvedKpiCardTotal')?.classList.add('active-filter');
  } else if (kpiType === 'full') {
    if (statusSelect) statusSelect.value = 'all';
    if (typeSelect) typeSelect.value = 'full';
    document.getElementById('approvedKpiCardFull')?.classList.add('active-filter');
  } else if (kpiType === 'partial') {
    if (statusSelect) statusSelect.value = 'all';
    if (typeSelect) typeSelect.value = 'partial';
    document.getElementById('approvedKpiCardPartial')?.classList.add('active-filter');
  } else if (kpiType === 'completed') {
    if (statusSelect) statusSelect.value = 'completed';
    if (typeSelect) typeSelect.value = 'all';
    document.getElementById('approvedKpiCardCompleted')?.classList.add('active-filter');
  }
  renderApprovedListView();
};

window.resetApprovedFilters = function() {
  const searchInput = document.getElementById('approvedSearchInput');
  const deptSelect = document.getElementById('approvedFilterDept');
  const statusSelect = document.getElementById('approvedFilterStatus');
  const typeSelect = document.getElementById('approvedFilterType');
  if (searchInput) searchInput.value = '';
  if (deptSelect) deptSelect.value = 'all';
  if (statusSelect) statusSelect.value = 'all';
  if (typeSelect) typeSelect.value = 'all';
  const cards = document.querySelectorAll('#approvedKpiRow .d365-kpi-card');
  cards.forEach(c => c.classList.remove('active-filter'));
  renderApprovedListView();
};

function initApprovedListListeners() {
  const searchInput = document.getElementById('approvedSearchInput');
  const deptSelect = document.getElementById('approvedFilterDept');
  const statusSelect = document.getElementById('approvedFilterStatus');
  const typeSelect = document.getElementById('approvedFilterType');

  if (searchInput) {
    searchInput.addEventListener('input', () => renderApprovedListView());
  }
  if (deptSelect) {
    deptSelect.addEventListener('change', () => renderApprovedListView());
  }
  if (statusSelect) {
    statusSelect.addEventListener('change', () => renderApprovedListView());
  }
  if (typeSelect) {
    typeSelect.addEventListener('change', () => renderApprovedListView());
  }
}

window.renderApprovedListView = function() {
  updateSitemapBadges();
  populateApprovedFilterDropdowns();

  const search = (document.getElementById('approvedSearchInput')?.value || '').toLowerCase().trim();
  const deptFilter = document.getElementById('approvedFilterDept')?.value || 'all';
  const statusFilter = document.getElementById('approvedFilterStatus')?.value || 'all';
  const typeFilter = document.getElementById('approvedFilterType')?.value || 'all';

  const allReqs = AppData.getRequisitions();
  let approvedList = allReqs.filter(r => r.status === 'approved' || r.status === 'completed');

  // Calculate KPIs on all approved
  const totalOrders = approvedList.length;
  const fullApprovalCount = approvedList.filter(r => r.approvalType === 'full' || (!r.approvalType && (r.approvedTotal === undefined || r.approvedTotal === r.totalAmount))).length;
  const partialApprovalCount = approvedList.filter(r => r.approvalType === 'partial' || (r.approvedTotal !== undefined && r.approvedTotal < r.totalAmount)).length;
  const completedCount = approvedList.filter(r => r.status === 'completed').length;
  const totalApprovedSpend = approvedList.reduce((sum, r) => sum + (r.approvedTotal !== undefined ? r.approvedTotal : r.totalAmount), 0);
  const totalOriginalSpend = approvedList.reduce((sum, r) => sum + r.totalAmount, 0);

  // Update 5 KPI tiles
  const elOrders = document.getElementById('kpiApprovedOrdersCount');
  if (elOrders) elOrders.textContent = totalOrders;
  const elOrdersSub = document.getElementById('kpiApprovedOrdersSubtitle');
  if (elOrdersSub) elOrdersSub.textContent = AppState.lang === 'kh' ? 'សំណើបានអនុម័តទាំងអស់' : 'All approved requisitions';

  const elFull = document.getElementById('kpiApprovedFullCount');
  if (elFull) elFull.textContent = fullApprovalCount;
  const elFullSub = document.getElementById('kpiApprovedFullSubtitle');
  if (elFullSub) elFullSub.textContent = AppState.lang === 'kh' ? 'អនុម័តបរិមាណ ១០០%' : '100% quantity approved';

  const elPartial = document.getElementById('kpiApprovedPartialCount');
  if (elPartial) elPartial.textContent = partialApprovalCount;
  const elPartialSub = document.getElementById('kpiApprovedPartialSubtitle');
  if (elPartialSub) elPartialSub.textContent = AppState.lang === 'kh' ? 'កម្រិតតាមស្តុកជាក់ស្តែង' : 'Limited by management';

  const elCompleted = document.getElementById('kpiApprovedCompletedCount');
  if (elCompleted) elCompleted.textContent = completedCount;
  const elCompletedSub = document.getElementById('kpiApprovedCompletedSubtitle');
  if (elCompletedSub) elCompletedSub.textContent = AppState.lang === 'kh' ? 'បានបញ្ជាទិញ & ប្រគល់រួច' : 'Delivered & closed orders';

  const elSpend = document.getElementById('kpiApprovedTotalSpend');
  if (elSpend) elSpend.textContent = formatCurrency(totalApprovedSpend);
  const elDiff = document.getElementById('kpiApprovedSavedDiff');
  if (elDiff) {
    const diff = totalApprovedSpend - totalOriginalSpend;
    if (diff < 0) {
      elDiff.textContent = AppState.lang === 'kh' ? `សន្សំបាន ${formatCurrency(Math.abs(diff))} ពីថវិកាស្នើ` : `Saved ${formatCurrency(Math.abs(diff))} from budget`;
    } else {
      elDiff.textContent = AppState.lang === 'kh' ? '១០០% ការប្តេជ្ញាថវិកា' : '100% budget commitment';
    }
  }

  // Apply filters
  if (deptFilter !== 'all') {
    approvedList = approvedList.filter(r => r.department === deptFilter);
  }
  if (statusFilter !== 'all') {
    approvedList = approvedList.filter(r => r.status === statusFilter);
  }
  if (typeFilter === 'full') {
    approvedList = approvedList.filter(r => r.approvalType === 'full' || (!r.approvalType && r.approvedTotal === r.totalAmount));
  } else if (typeFilter === 'partial') {
    approvedList = approvedList.filter(r => r.approvalType === 'partial' || (r.approvedTotal !== undefined && r.approvedTotal < r.totalAmount));
  }

  if (search) {
    approvedList = approvedList.filter(r => {
      const matchId = r.id.toLowerCase().includes(search);
      const matchReq = (r.requesterName || '').toLowerCase().includes(search);
      const matchDept = (r.department || '').toLowerCase().includes(search);
      const matchPurp = (r.purpose || '').toLowerCase().includes(search);
      return matchId || matchReq || matchDept || matchPurp;
    });
  }

  const tbody = document.getElementById('approvedTableBody');
  if (!tbody) return;

  if (approvedList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center py-4 text-muted">
          <span class="material-symbols-outlined" style="font-size:36px; color:#94a3b8; display:block; margin-bottom:8px;">fact_check</span>
          ${t('noRecordsFound')}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = approvedList.map(req => {
    const deptObj = AppData.getDepartments().find(d => d.id === req.department || d.code === req.department);
    const deptName = deptObj ? (AppState.lang === 'kh' ? (deptObj.nameKh || deptObj.nameEn) : (deptObj.nameEn || deptObj.nameKh)) : req.department;
    const prioBadge = getPriorityBadge(req.priority);
    const statusBadge = getStatusBadge(req.status);
    const approvedTotal = req.approvedTotal !== undefined ? req.approvedTotal : req.totalAmount;
    const isPartial = req.approvalType === 'partial' || approvedTotal < req.totalAmount;

    // Items chips
    const itemChips = (req.items || []).map(itm => {
      const appQty = itm.approvedQty !== undefined ? itm.approvedQty : itm.qty;
      const chipClass = appQty === itm.qty ? 'bg-light text-success border-success' : (appQty > 0 ? 'bg-light text-warning-emphasis border-warning' : 'bg-light text-danger border-danger');
      return `<span class="badge border ${chipClass} me-1 mb-1" style="font-weight:500; font-size:11.5px;" title="${itm.itemName}">
        ${itm.itemName.slice(0, 20)}${itm.itemName.length > 20 ? '...' : ''}: <strong>${appQty}/${itm.qty} ${itm.unit}</strong>
      </span>`;
    }).join('');

    return `
      <tr>
        <td>
          <a href="#" onclick="openRequisitionDetail('${req.id}'); return false;" class="fw-bold" style="font-family:monospace; color:var(--primary); font-size:13.5px;">
            ${req.id}
          </a>
        </td>
        <td>
          <span class="badge" style="background:#e2e8f0; color:#334155; font-weight:600;">${deptName}</span>
        </td>
        <td>
          <div class="fw-semibold">${req.requesterName}</div>
          <small class="text-muted">${req.requesterEmail || ''}</small>
        </td>
        <td>${prioBadge}</td>
        <td>${statusBadge}</td>
        <td>
          ${isPartial 
            ? `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning">${t('approvalTypePartial')}</span>` 
            : `<span class="badge bg-success-subtle text-success border border-success">${t('approvalTypeFull')}</span>`}
        </td>
        <td style="max-width:320px;">
          <div class="d-flex flex-wrap">${itemChips}</div>
        </td>
        <td style="text-align:right;">
          <div class="fw-bold text-success" style="font-size:14px;">${formatCurrency(approvedTotal)}</div>
          ${isPartial ? `<div class="small text-muted text-decoration-line-through">${formatCurrency(req.totalAmount)}</div>` : ''}
        </td>
        <td>
          <div class="small fw-semibold text-secondary">${req.approvedDate || req.requestDate}</div>
          <div class="small text-muted">${req.approvedBy || 'Management Reviewer'}</div>
        </td>
        <td style="text-align:center;">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-sm btn-outline-primary" onclick="openRequisitionDetail('${req.id}')" title="${t('actionView')}">
              <span class="material-symbols-outlined" style="font-size:15px;">visibility</span>
            </button>
            <button class="btn btn-sm btn-outline-secondary" onclick="printRequisition('${req.id}')" title="${t('actionPrint')}">
              <span class="material-symbols-outlined" style="font-size:15px;">print</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

window.exportApprovedToExcel = function() {
  const allReqs = AppData.getRequisitions();
  const approvedList = allReqs.filter(r => r.status === 'approved' || r.status === 'completed');

  if (approvedList.length === 0) {
    showToast(t('noRecordsFound'), 'info');
    return;
  }

  let csv = 'Requisition ID,Department,Requester Name,Email,Priority,Status,Approval Type,Request Date,Approved Date,Approved By,Item Name,Category,Requested Qty,Approved Qty,Unit,Unit Price,Approved Subtotal,Requested Total,Approved Total,Remarks\n';

  approvedList.forEach(req => {
    const deptObj = AppData.getDepartments().find(d => d.id === req.department || d.code === req.department);
    const deptName = deptObj ? deptObj.nameEn : req.department;

    (req.items || []).forEach(item => {
      const cat = AppData.getCategories().find(c => c.id === item.categoryId);
      const catName = cat ? cat.nameEn : item.categoryId;
      const appQty = item.approvedQty !== undefined ? item.approvedQty : item.qty;
      const appSubtotal = item.approvedSubtotal !== undefined ? item.approvedSubtotal : item.subtotal;
      const appTotal = req.approvedTotal !== undefined ? req.approvedTotal : req.totalAmount;

      const row = [
        `"${req.id}"`,
        `"${deptName}"`,
        `"${req.requesterName}"`,
        `"${req.requesterEmail || ''}"`,
        `"${req.priority}"`,
        `"${req.status}"`,
        `"${req.approvalType || 'full'}"`,
        `"${req.requestDate}"`,
        `"${req.approvedDate || ''}"`,
        `"${req.approvedBy || ''}"`,
        `"${(item.itemName || '').replace(/"/g, '""')}"`,
        `"${catName}"`,
        item.qty,
        appQty,
        `"${item.unit}"`,
        item.unitPrice,
        appSubtotal,
        req.totalAmount,
        appTotal,
        `"${(req.remarks || '').replace(/"/g, '""')}"`
      ];
      csv += row.join(',') + '\n';
    });
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SRPH_Approved_Allocations_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(AppState.lang === 'kh' ? 'បានទាញយកបញ្ជីអនុម័តជា CSV រួចរាល់!' : 'Approved orders exported to CSV successfully!', 'success');
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
  const isApprovedOrDone = req.status === 'approved' || req.status === 'completed';
  const isPartial = req.approvalType === 'partial' || (req.approvedTotal && req.approvedTotal < req.totalAmount);

  // Status Badge with Partial Approval indication if adjusted
  let statusBadge = getStatusBadge(req.status);
  if (isApprovedOrDone && isPartial) {
    statusBadge = `<span class="badge" style="background:#107c41; color:#fff; border:1px solid #0e6b37;">✓ ${t('statusApprovedAdjusted')}</span>`;
  }

  // Stepper Stage Calculation
  // Stage 1: Submitted (always done)
  const step1Class = 'completed';
  const step1Icon = '<span class="material-symbols-outlined" style="font-size:14px;">check</span>';
  const step1Detail = req.requestDate;

  // Stage 2: Management Review
  let step2Class = 'pending';
  let step2Icon = '2';
  let step2Detail = t('stageStatusWait');
  if (req.status === 'new') {
    step2Class = 'active';
    step2Icon = '<span class="material-symbols-outlined" style="font-size:14px;">schedule</span>';
    step2Detail = t('stageStatusWait');
  } else if (req.status === 'under_review') {
    step2Class = 'active';
    step2Icon = '<span class="material-symbols-outlined" style="font-size:14px;">schedule</span>';
    step2Detail = t('stageStatusActiveReview');
  } else {
    step2Class = 'completed';
    step2Icon = '<span class="material-symbols-outlined" style="font-size:14px;">check</span>';
    step2Detail = AppState.lang === 'kh' ? 'បានពិនិត្យរួចរាល់' : 'Reviewed';
  }

  // Stage 3: Management Decision (Approve / Decline)
  let step3Class = 'pending';
  let step3Icon = '3';
  let step3Detail = AppState.lang === 'kh' ? 'រង់ចាំការសម្រេច' : 'Pending Decision';
  if (req.status === 'approved' || req.status === 'completed') {
    step3Class = 'completed';
    step3Icon = '<span class="material-symbols-outlined" style="font-size:14px;">check</span>';
    step3Detail = isPartial ? t('statusApprovedAdjusted') : t('statusApproved');
  } else if (req.status === 'rejected') {
    step3Class = 'declined';
    step3Icon = '<span class="material-symbols-outlined" style="font-size:14px;">close</span>';
    step3Detail = t('statusRejected');
  }

  // Stage 4: Fulfillment / Delivery
  let step4Class = 'pending';
  let step4Icon = '4';
  let step4Detail = AppState.lang === 'kh' ? 'រង់ចាំការអនុម័ត' : 'Awaiting Approval';
  if (req.status === 'completed') {
    step4Class = 'completed';
    step4Icon = '<span class="material-symbols-outlined" style="font-size:14px;">done_all</span>';
    step4Detail = t('statusCompleted');
  } else if (req.status === 'approved') {
    step4Class = 'active';
    step4Icon = '<span class="material-symbols-outlined" style="font-size:14px;">local_shipping</span>';
    step4Detail = AppState.lang === 'kh' ? 'កំពុងរៀបចំបញ្ជាទិញ' : 'PO in progress';
  } else if (req.status === 'rejected') {
    step4Class = 'pending';
    step4Icon = '<span class="material-symbols-outlined" style="font-size:14px;">close</span>';
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
            <span class="material-symbols-outlined" style="font-size:16px; color:#ef4444; margin-right:4px; vertical-align:middle;">cancel</span>
            <span>${t('mgmtRemarksTitle')}: ${t('statusRejected')}</span>
          </div>
          <div class="mgmt-feedback-text">
            "${req.remarks || 'No detailed reason provided.'}"
          </div>
        </div>
        <button class="btn btn-sm btn-primary" onclick="cloneRequisitionToNew('${req.id}')" style="background:#be123c; border-color:#9f1239; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;">
          <span class="material-symbols-outlined" style="font-size:15px;">replay</span>
          <span>${t('btnResubmitModify')}</span>
        </button>
      </div>
    `;
  } else if (req.status === 'approved') {
    feedbackBoxHtml = `
      <div class="mgmt-feedback-box approved">
        <div>
          <div class="mgmt-feedback-title">
            <span class="material-symbols-outlined" style="font-size:16px; color:#10b981; margin-right:4px; vertical-align:middle;">verified</span>
            <span>${t('mgmtRemarksTitle')}: ${isPartial ? t('statusApprovedAdjusted') : t('statusApproved')}</span>
          </div>
          <div class="mgmt-feedback-text">
            "${req.remarks || 'Approved by Management & Admin.'}"
          </div>
          ${req.approvedTotal ? `
            <div class="mt-1 small" style="color:#065f46; font-weight:600;">
              <span>Approved Allocation: <strong>${formatCurrency(req.approvedTotal)}</strong></span>
              ${isPartial ? `<span class="text-muted ms-1">(Requested: ${formatCurrency(req.totalAmount)}, Diff: -${formatCurrency(req.totalAmount - req.approvedTotal)})</span>` : ''}
            </div>
          ` : ''}
        </div>
        <button class="btn btn-sm btn-outline" onclick="printRequisition('${req.id}')" style="white-space:nowrap; display:inline-flex; align-items:center; gap:4px;">
          <span class="material-symbols-outlined" style="font-size:15px;">print</span>
          <span>${t('actionPrint')}</span>
        </button>
      </div>
    `;
  } else if (req.status === 'under_review') {
    feedbackBoxHtml = `
      <div class="mgmt-feedback-box under_review">
        <div>
          <div class="mgmt-feedback-title">
            <span class="material-symbols-outlined" style="font-size:16px; color:#f59e0b; margin-right:4px; vertical-align:middle;">schedule</span>
            <span>${t('mgmtRemarksTitle')}: ${t('statusUnderReview')}</span>
          </div>
          <div class="mgmt-feedback-text">
            "${req.remarks || 'Under management review and budget verification.'}"
          </div>
        </div>
      </div>
    `;
  }

  // Items table preview with requested vs approved comparison
  const itemsRows = (req.items || []).map((itm, idx) => {
    const isAllocated = itm.approvedQty !== undefined;
    const appQty = isAllocated ? itm.approvedQty : itm.qty;
    const appSubtotal = itm.approvedSubtotal !== undefined ? itm.approvedSubtotal : itm.subtotal;
    const isReduced = isAllocated && itm.approvedQty < itm.qty;

    return `
      <tr>
        <td style="font-weight:600; width:35px;">#${idx + 1}</td>
        <td>
          <div style="font-weight:700;">${itm.itemName}</div>
          <div style="font-size:11.5px; color:var(--text-light);">${itm.spec || '-'}</div>
        </td>
        <td>
          ${isApprovedOrDone ? `
            <div>
              <strong style="color:#107c41; font-size:13px;">${appQty}</strong> <span class="text-muted small">/ ${itm.qty} ${itm.unit}</span>
              ${isReduced 
                ? `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning ms-1" style="font-size:10px;">Adjusted (-${itm.qty - appQty})</span>` 
                : `<span class="badge bg-success-subtle text-success border border-success ms-1" style="font-size:10px;">Full</span>`}
            </div>
          ` : `
            <strong>${itm.qty}</strong> ${itm.unit}
          `}
        </td>
        <td>${formatCurrency(itm.unitPrice)}</td>
        <td style="text-align:right; font-weight:700; color:var(--text-main);">
          ${isApprovedOrDone ? `
            <span style="color:#107c41;">${formatCurrency(appSubtotal)}</span>
            ${isReduced ? `<div style="font-size:11px; text-decoration:line-through; color:var(--text-light);">${formatCurrency(itm.subtotal)}</div>` : ''}
          ` : `
            ${formatCurrency(itm.subtotal)}
          `}
        </td>
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
              <th>${isApprovedOrDone ? t('thRequestedVsApproved') : `${t('colQty')} & ${t('colUnit')}`}</th>
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
        <div style="font-size:12.5px; color:var(--text-muted); display:flex; align-items:center; gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;">person</span>
          <span><strong>${req.requesterName}</strong> (${req.requesterEmail || ''})</span>
        </div>
        <div style="display:flex; align-items:center; gap:14px;">
          <div class="req-total-badge" style="${isApprovedOrDone && req.approvedTotal && req.approvedTotal !== req.totalAmount ? 'background:#dff6dd; border:1px solid #107c41; color:#107c41;' : ''}">
            <span style="font-size:12px; font-weight:600; color:var(--text-muted); margin-right:4px;">
              ${isApprovedOrDone && req.approvedTotal ? t('totalApprovedBudget') : t('grandTotal')}
            </span>
            <span style="font-weight:800; font-size:15px; color:${isApprovedOrDone ? '#107c41' : 'var(--text-main)'};">
              ${formatCurrency(isApprovedOrDone && req.approvedTotal !== undefined ? req.approvedTotal : req.totalAmount)}
            </span>
            ${isApprovedOrDone && req.approvedTotal && req.approvedTotal !== req.totalAmount ? `
              <span style="font-size:11.5px; text-decoration:line-through; opacity:0.75; margin-left:4px; color:#64748b;">${formatCurrency(req.totalAmount)}</span>
            ` : ''}
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn btn-sm btn-outline d-inline-flex align-items-center gap-1" onclick="openRequisitionDetail('${req.id}')">
              <span class="material-symbols-outlined" style="font-size:15px;">visibility</span>
              <span>${t('actionView')}</span>
            </button>
            ${req.status === 'new' 
              ? `<button class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1" onclick="openEditRequisition('${req.id}')" title="${t('actionEdit')}">
                   <span class="material-symbols-outlined" style="font-size:15px;">edit</span>
                   <span>${t('actionEdit')}</span>
                 </button>`
              : `<button class="btn btn-sm btn-outline-secondary disabled d-inline-flex align-items-center gap-1" disabled style="opacity:0.55; cursor:not-allowed;" title="${t('editLockedTooltip')}">
                   <span class="material-symbols-outlined" style="font-size:14px;">lock</span>
                   <span>${t('actionEditLocked')}</span>
                 </button>`
            }
            <button class="btn btn-sm btn-outline" onclick="printRequisition('${req.id}')" title="${t('actionPrint')}"><span class="material-symbols-outlined" style="font-size:15px;">print</span></button>
            ${req.status === 'rejected' ? `<button class="btn btn-sm btn-primary" onclick="cloneRequisitionToNew('${req.id}')" style="background:#be123c; border-color:#9f1239; display:inline-flex; align-items:center; gap:4px;"><span class="material-symbols-outlined" style="font-size:14px;">replay</span> <span>${t('btnResubmitModify')}</span></button>` : ''}
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

