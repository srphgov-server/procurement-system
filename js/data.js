// Initial Master Data and Storage Layer
const STORAGE_KEYS = {
  REQUISITIONS: 'procureflow_requisitions_v1',
  CATEGORIES: 'procureflow_categories_v1',
  ITEMS: 'procureflow_items_v1',
  USERS: 'procureflow_users_v1',
  DEPARTMENTS: 'procureflow_departments_v1',
  PRIORITIES: 'procureflow_priorities_v1',
  SETTINGS: 'procureflow_settings_v1'
};

const DEFAULT_DEPARTMENTS = [
  { id: 'IT', code: 'DEPT-IT', nameEn: 'Information Technology (IT)', nameKh: 'ព័ត៌មានវិទ្យា (IT)', desc: 'Enterprise IT, cloud systems, and network infrastructure', status: 'active' },
  { id: 'HR', code: 'DEPT-HR', nameEn: 'Human Resources (HR)', nameKh: 'ធនធានមនុស្ស (HR)', desc: 'Talent management, payroll, and training academy', status: 'active' },
  { id: 'Finance', code: 'DEPT-FIN', nameEn: 'Finance & Accounting', nameKh: 'ហិរញ្ញវត្ថុ & គណនេយ្យ', desc: 'Accounting, auditing, financial planning, and budgets', status: 'active' },
  { id: 'Operations', code: 'DEPT-OPS', nameEn: 'Operations', nameKh: 'ប្រតិបត្តិការទូទៅ', desc: 'Company operations and facility management', status: 'active' },
  { id: 'Logistics', code: 'DEPT-LOG', nameEn: 'Logistics & Warehouse', nameKh: 'ភស្តុភារ & ឃ្លាំងស្តុក', desc: 'Supply chain, freight, inventory distribution', status: 'active' },
  { id: 'Marketing', code: 'DEPT-MKT', nameEn: 'Marketing & Sales', nameKh: 'ទីផ្សារ & ការលក់', desc: 'Advertising, exhibitions, branding, customer acquisition', status: 'active' },
  { id: 'Admin', code: 'DEPT-ADM', nameEn: 'Administration', nameKh: 'រដ្ឋបាលទូទៅ', desc: 'General corporate affairs and legal documentation', status: 'active' },
  { id: 'Procurement', code: 'DEPT-PRO', nameEn: 'Procurement Dept', nameKh: 'ផ្នែកលទ្ធកម្ម', desc: 'Strategic sourcing, purchasing, supplier contracting', status: 'active' },

  // Hospital Clinical & Operational Departments (Siem Reap Referral Hospital)
  { id: 'MICU', code: 'DEPT-MICU', nameEn: 'Medical Intensive Care Unit', nameKh: 'ផ្នែកប្រពោធនកម្មជំងឺទូទៅ', desc: 'Medical Intensive Care and resuscitation services / ផ្នែកប្រពោធនកម្មជំងឺទូទៅ', status: 'active' },
  { id: 'CSSD', code: 'DEPT-CSSD', nameEn: 'Central Sterilization Supply Department', nameKh: 'ផ្នែកមជ្ឈមណ្ឌលរំងាប់មេរោគរួម', desc: 'Central Sterilization Supply and Medical Disinfection / មជ្ឈមណ្ឌលរំងាប់មេរោគរួម', status: 'active' },
  { id: 'Medical-Imagery', code: 'DEPT-IMG', nameEn: 'Medical Imagery', nameKh: 'ផ្នែកអេកូសាស្ត្រ', desc: 'Medical Imagery, Ultrasound, and Diagnostic Imaging / ផ្នែកអេកូសាស្ត្រ', status: 'active' },
  { id: 'Gynecology', code: 'DEPT-GYN', nameEn: 'Gynecology', nameKh: 'ផ្នែករោគស្ត្រី', desc: 'Gynecology and Women Health Clinical Services / ផ្នែករោគស្ត្រី', status: 'active' },
  { id: 'Abdominal-Thoracic-Surgery', code: 'DEPT-ATS', nameEn: 'Abdominal and Thoracic Surgery', nameKh: 'ផ្នែកសល្យសាស្ត្ររវីរង្គពោះ និងទ្រូង', desc: 'Abdominal, Visceral, and Thoracic Surgery / ផ្នែកសល្យសាស្ត្ររវីរង្គពោះ និងទ្រូង', status: 'active' },
  { id: 'Workshop', code: 'DEPT-WKS', nameEn: 'Workshop', nameKh: 'រោងជាងជួសជុលឧបករណ៍ពេទ្យ', desc: 'Biomedical Equipment Repair and Maintenance / រោងជាងជួសជុលឧបករណ៍ពេទ្យ', status: 'active' },
  { id: 'General-OPD', code: 'DEPT-OPD', nameEn: 'General OPD Department', nameKh: 'ផ្នែកពិគ្រោះជំងឺក្រៅ', desc: 'General Outpatient Consultations / ផ្នែកពិគ្រោះជំងឺក្រៅ', status: 'active' },
  { id: 'Diabetic-Hypertension', code: 'DEPT-DHT', nameEn: 'Diabetic and Hypertension', nameKh: 'ផ្នែកជំងឺទឹកនោមផ្អែម និងលើសឈាម', desc: 'Diabetic and Hypertension Chronic Care / ផ្នែកជំងឺទឹកនោមផ្អែម និងលើសឈាម', status: 'active' },
  { id: 'Ophthalmology', code: 'DEPT-OPH', nameEn: 'Ophthalmology', nameKh: 'ផ្នែកចក្ខុរោគ', desc: 'Eye Care, Screening, and Ophthalmology / ផ្នែកចក្ខុរោគ', status: 'active' },
  { id: 'Pharmacy', code: 'DEPT-PHARM', nameEn: 'Pharmacy', nameKh: 'ផ្នែកឱសថស្ថាន', desc: 'Pharmaceutical Services and Dispensary / ផ្នែកឱសថស្ថាន', status: 'active' },
  { id: 'Cardiology-Center', code: 'DEPT-CARD', nameEn: 'Cardiology Center', nameKh: 'ផ្នែកមជ្ឈមណ្ឌលបេះដូង', desc: 'Cardiology and Cardiovascular Center / ផ្នែកមជ្ឈមណ្ឌលបេះដូង', status: 'active' },
  { id: 'Internal-Medicine-A', code: 'DEPT-IMA', nameEn: 'Internal Medicine A', nameKh: 'ផ្នែកជំងឺទូទៅ (ក)', desc: 'General Internal Medicine Ward A / ផ្នែកជំងឺទូទៅ (ក)', status: 'active' },
  { id: 'Trauma-Orthopedic', code: 'DEPT-ORT', nameEn: 'Trauma and Orthopedic', nameKh: 'ផ្នែកសល្យសាស្ត្រឆ្អឹង-សន្លាក់', desc: 'Trauma, Bone, and Orthopedic Surgery / ផ្នែកសល្យសាស្ត្រឆ្អឹង-សន្លាក់', status: 'active' },
  { id: 'Neurosurgery', code: 'DEPT-NSG', nameEn: 'Neurosurgery', nameKh: 'ផ្នែកសល្យសាស្ត្រប្រព័ន្ធប្រសាទ', desc: 'Brain, Spine, and Neurosurgical Care / ផ្នែកសល្យសាស្ត្រប្រព័ន្ធប្រសាទ', status: 'active' }
];

const DEFAULT_PRIORITIES = [
  {
    id: 'urgent',
    code: 'PRI-URG',
    nameEn: 'Urgent',
    nameKh: 'បន្ទាន់បំផុត',
    slaHours: 24,
    color: '#ef4444',
    badgeClass: 'badge-priority-urgent',
    desc: 'Immediate emergency or critical business disruption needs',
    status: 'active'
  },
  {
    id: 'high',
    code: 'PRI-HIGH',
    nameEn: 'High',
    nameKh: 'ខ្ពស់',
    slaHours: 48,
    color: '#f97316',
    badgeClass: 'badge-priority-high',
    desc: 'Time-sensitive project milestones or departmental deliverables',
    status: 'active'
  },
  {
    id: 'medium',
    code: 'PRI-MED',
    nameEn: 'Medium',
    nameKh: 'មធ្យម',
    slaHours: 72,
    color: '#3b82f6',
    badgeClass: 'badge-priority-medium',
    desc: 'Standard scheduled departmental purchases and equipment',
    status: 'active'
  },
  {
    id: 'low',
    code: 'PRI-LOW',
    nameEn: 'Low',
    nameKh: 'ទាប',
    slaHours: 120,
    color: '#64748b',
    badgeClass: 'badge-priority-low',
    desc: 'Routine replenishment, buffer stock, or non-urgent supplies',
    status: 'active'
  }
];

const DEFAULT_CATEGORIES = [
  { id: 'CAT-001', code: 'IT-EQ', nameEn: 'IT & Electronics', nameKh: 'ឧបករណ៍បច្ចេកវិទ្យា & អេឡិចត្រូនិក', desc: 'Computers, laptops, monitors, network gear', status: 'active' },
  { id: 'CAT-002', code: 'OFF-SUP', nameEn: 'Office Supplies', nameKh: 'សម្ភារៈការិយាល័យទូទៅ', desc: 'Paper, pens, toner cartridges, binders', status: 'active' },
  { id: 'CAT-003', code: 'FURN', nameEn: 'Office Furniture', nameKh: 'គ្រឿងសង្ហារិមការិយាល័យ', desc: 'Desks, ergonomic chairs, cabinets', status: 'active' },
  { id: 'CAT-004', code: 'FAC-MNT', nameEn: 'Facilities & Maintenance', nameKh: 'ឧបករណ៍ថែទាំ & អនាម័យ', desc: 'Cleaning supplies, tools, maintenance parts', status: 'active' },
  { id: 'CAT-005', code: 'MKT-PR', nameEn: 'Marketing & Promotional', nameKh: 'សម្ភារៈផ្សព្វផ្សាយ & ព្រឹត្តិការណ៍', desc: 'Event banners, corporate gifts, brochures', status: 'active' },
  { id: 'CAT-006', code: 'FOOD-BV', nameEn: 'Food & Pantry', nameKh: 'ចំណីអាហារ & ភេសជ្ជៈការិយាល័យ', desc: 'Coffee, water, snacks for meetings', status: 'active' }
];

const DEFAULT_ITEMS = [
  { id: 'ITM-101', code: 'LAPTOP-PRO', nameEn: 'Dell Latitude Core i7 Laptop', nameKh: 'កុំព្យូទ័រយួរដៃ Dell Core i7', categoryId: 'CAT-001', unit: 'Unit', estimatedPrice: 1150.00, status: 'active' },
  { id: 'ITM-102', code: 'MON-27', nameEn: '27-inch 4K IPS Monitor', nameKh: 'អេក្រង់កុំព្យូទ័រ 27 អ៊ីញ 4K', categoryId: 'CAT-001', unit: 'Unit', estimatedPrice: 285.00, status: 'active' },
  { id: 'ITM-103', code: 'WL-MOU', nameEn: 'Logitech Wireless Mouse & Keyboard', nameKh: 'ក្តារចុច និងកណ្តុរឥតខ្សែ Logitech', categoryId: 'CAT-001', unit: 'Set', estimatedPrice: 45.00, status: 'active' },
  { id: 'ITM-104', code: 'PAP-A4', nameEn: 'Double A A4 Copy Paper (80gsm)', nameKh: 'ក្រដាស A4 Double A (៨០ក្រាម)', categoryId: 'CAT-002', unit: 'Box', estimatedPrice: 28.00, status: 'active' },
  { id: 'ITM-105', code: 'TON-HP', nameEn: 'HP LaserJet High-Yield Toner', nameKh: 'ទឹកថ្នាំព្រីនធ័រ HP LaserJet', categoryId: 'CAT-002', unit: 'Pcs', estimatedPrice: 85.00, status: 'active' },
  { id: 'ITM-106', code: 'PEN-BOX', nameEn: 'Gel Ink Pen Blue 0.5mm (Box of 50)', nameKh: 'ប៊ិចទឹកពណ៌ខៀវ 0.5mm (ប្រអប់៥០ដើម)', categoryId: 'CAT-002', unit: 'Box', estimatedPrice: 16.50, status: 'active' },
  { id: 'ITM-107', code: 'CHR-ERGO', nameEn: 'Ergonomic Mesh Office Chair', nameKh: 'កៅអីការិយាល័យសុខភាពសំណាញ់', categoryId: 'CAT-003', unit: 'Unit', estimatedPrice: 175.00, status: 'active' },
  { id: 'ITM-108', code: 'DSK-STAND', nameEn: 'Electric Standing Desk (140x70cm)', nameKh: 'តុការងារអគ្គិសនីបញ្ឈរ-អង្គុយ', categoryId: 'CAT-003', unit: 'Unit', estimatedPrice: 340.00, status: 'active' },
  { id: 'ITM-109', code: 'COF-BEAN', nameEn: 'Arabica Coffee Beans 1kg Bag', nameKh: 'គ្រាប់កាហ្វេ Arabica ១គីឡូក្រាម', categoryId: 'CAT-006', unit: 'Pack', estimatedPrice: 18.00, status: 'active' },
  { id: 'ITM-110', code: 'BNR-ROLL', nameEn: 'Roll-up Stand Banner (85x200cm)', nameKh: 'បដាផ្សព្វផ្សាយ Roll-up Stand', categoryId: 'CAT-005', unit: 'Pcs', estimatedPrice: 35.00, status: 'active' }
];

const DEFAULT_USERS = [
  { id: 'USR-001', name: 'Sokha Chan', email: 'sokha.chan@company.com', department: 'Admin', role: 'admin', status: 'active' },
  { id: 'USR-002', name: 'Vireak Vong', email: 'vireak.vong@company.com', department: 'Procurement', role: 'management', status: 'active' },
  { id: 'USR-003', name: 'Rithy Seng', email: 'rithy.seng@company.com', department: 'IT', role: 'requester', status: 'active' },
  { id: 'USR-004', name: 'Bopha Keo', email: 'bopha.keo@company.com', department: 'HR', role: 'requester', status: 'active' },
  { id: 'USR-005', name: 'Dara Pich', email: 'dara.pich@company.com', department: 'Marketing', role: 'requester', status: 'active' },
  { id: 'USR-006', name: 'Chenda Mom', email: 'chenda.mom@company.com', department: 'Finance', role: 'requester', status: 'active' },
  { id: 'USR-007', name: 'Channary Lim', email: 'channary.lim@company.com', department: 'Operations', role: 'requester', status: 'active' }
];

const DEFAULT_REQUISITIONS = [
  {
    id: 'REQ-2026-001',
    requestDate: '2026-10-20',
    neededDate: '2026-10-24',
    department: 'IT',
    requesterName: 'Rithy Seng',
    requesterEmail: 'rithy.seng@company.com',
    priority: 'urgent',
    purpose: 'Urgent workstation upgrade for upcoming cloud infrastructure migration project team.',
    items: [
      { itemId: 'ITM-101', itemName: 'Dell Latitude Core i7 Laptop', categoryId: 'CAT-001', spec: '16GB RAM, 512GB NVMe SSD, Win 11 Pro', qty: 2, unit: 'Unit', unitPrice: 1150.00, subtotal: 2300.00 },
      { itemId: 'ITM-102', itemName: '27-inch 4K IPS Monitor', categoryId: 'CAT-001', spec: 'USB-C 90W charging, HDMI/DP', qty: 2, unit: 'Unit', unitPrice: 285.00, subtotal: 570.00 }
    ],
    totalAmount: 2870.00,
    status: 'new',
    remarks: 'Awaiting management review.',
    history: [
      { action: 'Created', byRole: 'requester', byUser: 'Rithy Seng', timestamp: '2026-10-20 09:15 AM', comment: 'Requisition submitted by IT department' }
    ]
  },
  {
    id: 'REQ-2026-002',
    requestDate: '2026-10-18',
    neededDate: '2026-10-26',
    department: 'HR',
    requesterName: 'Bopha Keo',
    requesterEmail: 'bopha.keo@company.com',
    priority: 'high',
    purpose: 'Quarterly office supplies replenishment for training academy and new employee on-boarding kits.',
    items: [
      { itemId: 'ITM-104', itemName: 'Double A A4 Copy Paper (80gsm)', categoryId: 'CAT-002', spec: '5 reams per box, brightness 102%', qty: 10, unit: 'Box', unitPrice: 28.00, subtotal: 280.00 },
      { itemId: 'ITM-105', itemName: 'HP LaserJet High-Yield Toner', categoryId: 'CAT-002', spec: 'Black toner model 58A', qty: 4, unit: 'Pcs', unitPrice: 85.00, subtotal: 340.00 },
      { itemId: 'ITM-106', itemName: 'Gel Ink Pen Blue 0.5mm (Box of 50)', categoryId: 'CAT-002', spec: 'Quick drying blue ink', qty: 5, unit: 'Box', unitPrice: 16.50, subtotal: 82.50 }
    ],
    totalAmount: 702.50,
    status: 'under_review',
    remarks: 'Procurement checking supplier inventory discount.',
    history: [
      { action: 'Created', byRole: 'requester', byUser: 'Bopha Keo', timestamp: '2026-10-18 10:30 AM', comment: 'Requisition created for HR training needs' },
      { action: 'Reviewed', byRole: 'management', byUser: 'Vireak Vong', timestamp: '2026-10-19 02:20 PM', comment: 'Reviewed and forwarded to admin for budget verification' }
    ]
  },
  {
    id: 'REQ-2026-003',
    requestDate: '2026-10-15',
    neededDate: '2026-10-22',
    department: 'Marketing',
    requesterName: 'Dara Pich',
    requesterEmail: 'dara.pich@company.com',
    priority: 'medium',
    purpose: 'Annual tech expo exhibition booth setup and client hospitality display.',
    items: [
      { itemId: 'ITM-110', itemName: 'Roll-up Stand Banner (85x200cm)', categoryId: 'CAT-005', spec: 'High-res vinyl print with aluminum base', qty: 4, unit: 'Pcs', unitPrice: 35.00, subtotal: 140.00, approvedQty: 2, approvedSubtotal: 70.00 },
      { itemId: 'ITM-109', itemName: 'Arabica Coffee Beans 1kg Bag', categoryId: 'CAT-006', spec: 'Premium dark roast for client hospitality', qty: 6, unit: 'Pack', unitPrice: 18.00, subtotal: 108.00, approvedQty: 6, approvedSubtotal: 108.00 }
    ],
    totalAmount: 248.00,
    approvedTotal: 178.00,
    approvedDate: '2026-10-16',
    approvedBy: 'Sokha Chan (Administrator)',
    approvalType: 'partial',
    status: 'approved',
    remarks: 'Approved with allocation adjustment: Limited banners to 2 units due to stock limitation; coffee beans fully approved.',
    history: [
      { action: 'Created', byRole: 'requester', byUser: 'Dara Pich', timestamp: '2026-10-15 08:45 AM', comment: 'Initial submission' },
      { action: 'Reviewed', byRole: 'management', byUser: 'Vireak Vong', timestamp: '2026-10-15 03:00 PM', comment: 'Recommended for approval' },
      { action: 'Approved', byRole: 'admin', byUser: 'Sokha Chan', timestamp: '2026-10-16 11:15 AM', comment: 'Budget approved with allocation adjustment: $178.00 approved' }
    ]
  },
  {
    id: 'REQ-2026-004',
    requestDate: '2026-10-12',
    neededDate: '2026-10-16',
    department: 'Operations',
    requesterName: 'Channary Lim',
    requesterEmail: 'channary.lim@company.com',
    priority: 'low',
    purpose: 'Ergonomic posture improvement for operations desk staff.',
    items: [
      { itemId: 'ITM-107', itemName: 'Ergonomic Mesh Office Chair', categoryId: 'CAT-003', spec: 'Lumbar support, 3D armrests', qty: 3, unit: 'Unit', unitPrice: 175.00, subtotal: 525.00, approvedQty: 3, approvedSubtotal: 525.00 }
    ],
    totalAmount: 525.00,
    approvedTotal: 525.00,
    approvedDate: '2026-10-13',
    approvedBy: 'Sokha Chan (Administrator)',
    approvalType: 'full',
    status: 'completed',
    remarks: 'PO issued to supplier. Goods delivered and distributed.',
    history: [
      { action: 'Created', byRole: 'requester', byUser: 'Channary Lim', timestamp: '2026-10-12 11:00 AM', comment: 'Requisition submitted' },
      { action: 'Approved', byRole: 'admin', byUser: 'Sokha Chan', timestamp: '2026-10-13 09:30 AM', comment: 'Approved for purchase (100% allocation)' },
      { action: 'Completed', byRole: 'admin', byUser: 'Sokha Chan', timestamp: '2026-10-17 04:00 PM', comment: 'Delivered and closed order' }
    ]
  },
  {
    id: 'REQ-2026-005',
    requestDate: '2026-10-10',
    neededDate: '2026-10-14',
    department: 'Finance',
    requesterName: 'Chenda Mom',
    requesterEmail: 'chenda.mom@company.com',
    priority: 'medium',
    purpose: 'High end custom gaming chairs for conference room.',
    items: [
      { itemId: 'custom-1', itemName: 'Gaming Style Reclining Chair', categoryId: 'CAT-003', spec: 'RGB lighting and leather cushion', qty: 4, unit: 'Unit', unitPrice: 420.00, subtotal: 1680.00 }
    ],
    totalAmount: 1680.00,
    status: 'rejected',
    remarks: 'Rejected: Does not meet company ergonomics guidelines and exceeds conference budget.',
    history: [
      { action: 'Created', byRole: 'requester', byUser: 'Chenda Mom', timestamp: '2026-10-10 02:00 PM', comment: 'Submitted requisition' },
      { action: 'Rejected', byRole: 'admin', byUser: 'Sokha Chan', timestamp: '2026-10-11 10:15 AM', comment: 'Rejected: Specification not justified for conference room' }
    ]
  }
];

// App Database Accessor
const AppData = {
  getRequisitions() {
    const raw = localStorage.getItem(STORAGE_KEYS.REQUISITIONS);
    let list;
    if (!raw) {
      this.saveRequisitions(DEFAULT_REQUISITIONS);
      list = JSON.parse(JSON.stringify(DEFAULT_REQUISITIONS));
    } else {
      try {
        list = JSON.parse(raw);
      } catch (e) {
        list = JSON.parse(JSON.stringify(DEFAULT_REQUISITIONS));
      }
    }
    // Ensure approved/completed items have approvedQty populated
    list.forEach(req => {
      if ((req.status === 'approved' || req.status === 'completed') && (req.approvedTotal === undefined || req.approvedTotal === null)) {
        let total = 0;
        (req.items || []).forEach(item => {
          if (item.approvedQty === undefined) item.approvedQty = item.qty;
          if (item.approvedSubtotal === undefined) item.approvedSubtotal = Number((item.approvedQty * item.unitPrice).toFixed(2));
          total += item.approvedSubtotal;
        });
        req.approvedTotal = Number(total.toFixed(2));
        if (!req.approvalType) req.approvalType = req.approvedTotal === req.totalAmount ? 'full' : 'partial';
      }
    });
    return list;
  },

  saveRequisitions(data) {
    localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(data));
  },

  getCategories() {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      this.saveCategories(DEFAULT_CATEGORIES);
      return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    }
  },

  saveCategories(data) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data));
  },

  getItems() {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!raw) {
      this.saveItems(DEFAULT_ITEMS);
      return JSON.parse(JSON.stringify(DEFAULT_ITEMS));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_ITEMS));
    }
  },

  saveItems(data) {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(data));
  },

  getUsers() {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      this.saveUsers(DEFAULT_USERS);
      return JSON.parse(JSON.stringify(DEFAULT_USERS));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_USERS));
    }
  },

  saveUsers(data) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data));
  },

  getDepartments() {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    let list;
    if (!raw) {
      this.saveDepartments(DEFAULT_DEPARTMENTS);
      return JSON.parse(JSON.stringify(DEFAULT_DEPARTMENTS));
    }
    try {
      list = JSON.parse(raw);
    } catch (e) {
      list = JSON.parse(JSON.stringify(DEFAULT_DEPARTMENTS));
    }

    // Auto-sync missing default departments (including hospital departments)
    let modified = false;
    DEFAULT_DEPARTMENTS.forEach(defDept => {
      const exists = list.some(d => d.id === defDept.id || d.code === defDept.code || (d.nameKh && d.nameKh === defDept.nameKh));
      if (!exists) {
        list.push(JSON.parse(JSON.stringify(defDept)));
        modified = true;
      }
    });

    if (modified) {
      this.saveDepartments(list);
    }
    return list;
  },

  saveDepartments(data) {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(data));
  },

  getPriorities() {
    const raw = localStorage.getItem(STORAGE_KEYS.PRIORITIES);
    if (!raw) {
      this.savePriorities(DEFAULT_PRIORITIES);
      return JSON.parse(JSON.stringify(DEFAULT_PRIORITIES));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_PRIORITIES));
    }
  },

  savePriorities(data) {
    localStorage.setItem(STORAGE_KEYS.PRIORITIES, JSON.stringify(data));
  },

  resetAllToDefault() {
    localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(DEFAULT_REQUISITIONS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(DEFAULT_ITEMS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(DEFAULT_DEPARTMENTS));
    localStorage.setItem(STORAGE_KEYS.PRIORITIES, JSON.stringify(DEFAULT_PRIORITIES));
  }
};
