// Initial Master Data and Storage Layer
const STORAGE_KEYS = {
  REQUISITIONS: 'procureflow_requisitions_v1',
  CATEGORIES: 'procureflow_categories_v1',
  ITEMS: 'procureflow_items_v1',
  USERS: 'procureflow_users_v1',
  SETTINGS: 'procureflow_settings_v1'
};

const DEFAULT_DEPARTMENTS = [
  { id: 'IT', nameEn: 'Information Technology (IT)', nameKh: 'ព័ត៌មានវិទ្យា (IT)' },
  { id: 'HR', nameEn: 'Human Resources (HR)', nameKh: 'ធនធានមនុស្ស (HR)' },
  { id: 'Finance', nameEn: 'Finance & Accounting', nameKh: 'ហិរញ្ញវត្ថុ & គណនេយ្យ' },
  { id: 'Operations', nameEn: 'Operations', nameKh: 'ប្រតិបត្តិការទូទៅ' },
  { id: 'Logistics', nameEn: 'Logistics & Warehouse', nameKh: 'ភស្តុភារ & ឃ្លាំងស្តុក' },
  { id: 'Marketing', nameEn: 'Marketing & Sales', nameKh: 'ទីផ្សារ & ការលក់' },
  { id: 'Admin', nameEn: 'Administration', nameKh: 'រដ្ឋបាលទូទៅ' },
  { id: 'Procurement', nameEn: 'Procurement Dept', nameKh: 'ផ្នែកលទ្ធកម្ម' }
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
  { id: 'USR-005', name: 'Dara Pich', email: 'dara.pich@company.com', department: 'Marketing', role: 'requester', status: 'active' }
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
      { itemId: 'ITM-110', itemName: 'Roll-up Stand Banner (85x200cm)', categoryId: 'CAT-005', spec: 'High-res vinyl print with aluminum base', qty: 4, unit: 'Pcs', unitPrice: 35.00, subtotal: 140.00 },
      { itemId: 'ITM-109', itemName: 'Arabica Coffee Beans 1kg Bag', categoryId: 'CAT-006', spec: 'Premium dark roast for client hospitality', qty: 6, unit: 'Pack', unitPrice: 18.00, subtotal: 108.00 }
    ],
    totalAmount: 248.00,
    status: 'approved',
    remarks: 'Approved under Marketing Q4 Event Budget #MKT-2026.',
    history: [
      { action: 'Created', byRole: 'requester', byUser: 'Dara Pich', timestamp: '2026-10-15 08:45 AM', comment: 'Initial submission' },
      { action: 'Reviewed', byRole: 'management', byUser: 'Vireak Vong', timestamp: '2026-10-15 03:00 PM', comment: 'Recommended for approval' },
      { action: 'Approved', byRole: 'admin', byUser: 'Sokha Chan', timestamp: '2026-10-16 11:15 AM', comment: 'Budget approved by Admin' }
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
      { itemId: 'ITM-107', itemName: 'Ergonomic Mesh Office Chair', categoryId: 'CAT-003', spec: 'Lumbar support, 3D armrests', qty: 3, unit: 'Unit', unitPrice: 175.00, subtotal: 525.00 }
    ],
    totalAmount: 525.00,
    status: 'completed',
    remarks: 'PO issued to supplier. Goods delivered and distributed.',
    history: [
      { action: 'Created', byRole: 'requester', byUser: 'Channary Lim', timestamp: '2026-10-12 11:00 AM', comment: 'Requisition submitted' },
      { action: 'Approved', byRole: 'admin', byUser: 'Sokha Chan', timestamp: '2026-10-13 09:30 AM', comment: 'Approved for purchase' },
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
    if (!raw) {
      this.saveRequisitions(DEFAULT_REQUISITIONS);
      return JSON.parse(JSON.stringify(DEFAULT_REQUISITIONS));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_REQUISITIONS));
    }
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

  resetAllToDefault() {
    localStorage.setItem(STORAGE_KEYS.REQUISITIONS, JSON.stringify(DEFAULT_REQUISITIONS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(DEFAULT_ITEMS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  },

  getDepartments() {
    return DEFAULT_DEPARTMENTS;
  }
};
