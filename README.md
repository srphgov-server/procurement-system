# Siem Reap Referral Hospital | ProcureFlow - Sourcing & Procurement (ប្រព័ន្ធគ្រប់គ្រងលទ្ធកម្ម)

A full-featured, enterprise-grade Procurement Management System for **Siem Reap Referral Hospital (មន្ទីរពេទ្យបង្អែកខេត្តសៀមរាប)** modeled after **Microsoft Dynamics 365 (Supply Chain Management & Procurement)**, built with the **Bootstrap library** and **Fluent 2 design system**. Features full bilingual support (**English** & **Khmer / ភាសាខ្មែរ**), departmental purchase requisitions, priority tracking with real-time KPI metrics, role-based workflows for Management and Administrators, and master list management.

---

## 🎨 Microsoft Dynamics 365 Design Architecture & Bootstrap Integration

- **Microsoft 365 Top Suite Bar (`#002050` Deep Navy)**:
  - 9-dot Waffle App Launcher button with sidebar toggle.
  - Global Siem Reap Referral Hospital Branding with `USMF Production` environment status tag.
  - Global Suite Search with `Alt+Q` keyboard shortcut hint.
  - Role/Persona security switcher, bilingual toggle (`EN` / `ខ្មែរ`), quick notifications, and user avatar.
- **Dynamics 365 Command Bar (Horizontal Action Ribbon)**:
  - High-efficiency enterprise toolbar: `+ New Requisition`, `Refresh`, `Export to Excel`, `Print Voucher`, `Requester Portal`, and `Reset Data`.
  - Dynamic breadcrumb navigation trail (`Siem Reap Referral Hospital › Procurement & Sourcing › Requisitions`).
- **Collapsible Left Sitemap Rail (Navigation Bar)**:
  - Enterprise sitemap grouped into: `MY WORK` (Board & Requester Portal), `PROCUREMENT` (New Requisition), and `MASTER LISTS` (Departments, Urgency/Priorities, Categories, Catalog, Users).
  - Hamburger expand/collapse toggle with smooth width animation.
  - Dynamic active indicator highlighting current workspace view.
- **Business Process Flow (BPF) Chevron Stage Gate Bar**:
  - Visible 4-stage sequential chevron gate: `1. Draft & Submitted` ➔ `2. Management Review` ➔ `3. Approval Decision` ➔ `4. Sourcing & Delivery`.
  - Dynamic state tracking for requisitions showing real-time stage progression and decisions.
- **Dynamics 365 FastTabs in Forms**:
  - Collapsible, summarized FastTabs for `General Information` and `Requested Line Items`.
  - Clean chevron toggles and live header summaries.
- **Fluent High-Density Data Grids & KPI Tiles**:
  - High-density data grid with monospace requisition tags (`REQ-2026-001`), interactive sorting, and status pills.
  - Interactive KPI metric cards with accent indicator bars and pulsating urgency dots.
- **Bootstrap 5 Library**:
  - Modern, responsive 12-column grid system, utility classes, and Bootstrap Icons.

---

## 🌟 Key Features

### 1. Department Requisition Form (ទម្រង់ស្នើសុំលទ្ធកម្ម)
- **FastTab Structure**: Organized into `General Information` and `Requested Line Items`.
- **Department & Priority Selection**: Dynamically loaded from Master List Management with real-time SLA hours tracking.
- **Requester Information**: Name, Email, Request Date, Required-by Date, and Business Justification.
- **Category-First Requested Line Items (ជ្រើសរើសប្រភេទមុខទំនិញជាមុន)**:
  - **Category-First Workflow**: Select the procurement **Category** first (`IT & Electronics`, `Office Supplies`, `Office Furniture`, etc.).
  - **Filtered Catalog Items**: The item dropdown dynamically filters to only show catalog items belonging to that chosen category.
  - **Auto-Fill Unit & Unit Price**: Selecting a catalog item automatically populates its standardized unit and estimated price.
  - **Custom Item Name Option**: Users can select `+ Custom Item Name...` under any category to freely enter a custom non-catalog item name, custom specs, and pricing.
  - **Real-time Subtotal & Grand Total**: Immediate calculation of line subtotals and grand total as quantities or prices change.
  - **Auto-generated Sequential Requisition ID**: E.g., `REQ-2026-001`, `REQ-2026-002`.

### 2. Separated Requester Dashboard & Management Situation Tracker (ផ្ទាំងតាមដានរបស់អ្នកស្នើសុំ & ស្ថានភាពពីថ្នាក់ដឹកនាំ)
- **Dedicated Requester Portal**: Tailored view for department staff to follow their requisition status and decisions from Management.
- **Requester Persona / Account Switcher**: Switch between specific requester profiles (IT, HR, Marketing, Finance, Operations) or view all requisitions.
- **Management Situation KPI Metric Cards**:
  - **Total My Requests** (សំណើសរុប)
  - **In Review by Management** (កំពុងស្ថិតក្នុងការពិនិត្យ) with live status pulse
  - **Approved by Management** (បានអនុម័តដោយថ្នាក់ដឹកនាំ)
  - **Declined by Management** (បានបដិសេធដោយថ្នាក់ដឹកនាំ) with attention alert
  - **Completed & Delivered** (បានទទួលទំនិញរួចរាល់)
- **4-Stage Visual Progress Stepper**: Real-time progress bar on every request:
  1. 📝 `Submitted` ➔ 2. 👔 `Management Review` ➔ 3. ⚖️ `Management Decision (Approved / Declined)` ➔ 4. 📦 `Fulfillment / Delivered`.
- **Management Feedback & Declining Reason Callout**:
  - Clear highlight box showing reviewer comments, approval notes, or reasons for decline.
  - **1-Click Re-submit / Modify (`🔄 Modify & Re-submit`)**: Instantly reloads the declined requisition's line items and specs into the form for easy adjustment and resubmission.
- **Action Alerts Banner**: Instant notice when requests are approved or require revision due to decline.

### 3. Requisition Board & Priority KPI Tracker (ផ្ទាំងគ្រប់គ្រង & KPI តាមដានអាទិភាព)
- **Interactive KPI Metric Boxes**:
  - **Total Requisitions** (ចំនួនសំណើសរុប)
  - **New / Pending Review** (សំណើថ្មី / កំពុងរង់ចាំការពិនិត្យ)
  - **Urgent & High Priority** (អាទិភាពបន្ទាន់ & ខ្ពស់) with glowing pulse indicator
  - **Approved Requests** (សំណើបានអនុម័ត)
  - **Total Estimated Budget Value** (តម្លៃប៉ាន់ស្មានសរុបជាដុល្លារ)
- **Interactive Quick Filter**: Clicking on any KPI card instantly filters the table.
- **Priority Breakdown Bar**: Visual counters for `Urgent`, `High`, `Medium`, and `Low` priorities.
- **Comprehensive Filtering**: Search by ID, Requester, Department, Purpose, or filter by Status and Priority.

### 4. Role-Based Workflow & Approvals (តួនាទី & ដំណាក់កាលការងារ)
Switch between roles instantly from the top bar:
- 👨‍💼 **Requester (Dept Staff)**: Submits new purchase requests and tracks department requests.
- 👔 **Management (Reviewer)**: 
  - Alert banner notifies how many `New` requests require attention.
  - Can review requests, add remarks, and mark them as `Under Review`.
- 🛡️ **Administrator (Approver & Master Controller)**:
  - Full authority to Review, **Approve**, **Reject** (with reason), or mark as **Completed / Ordered**.
  - Exclusive access to List Management (Categories, Items, Users).
- **Audit History Timeline**: Complete trace of every action, who performed it, their role, timestamp, and comments.

### 5. Master List Management (ការគ្រប់គ្រងបញ្ជីទិន្នន័យមេ)
- **Requesting Department Management (ការគ្រប់គ្រងផ្នែកស្នើសុំ)**:
  - Add, edit, or deactivate company departments with custom Department Codes (e.g., `DEPT-SEC`, `DEPT-IT`), Key IDs, bilingual names (English & Khmer), and descriptions.
  - Live requisition counters tracking how many requisitions each department has filed.
  - Safe deletion protection preventing removal of departments linked to existing purchase records.
  - Dynamic integration updating requisition forms, filter dropdowns, and user creation selects automatically.
- **Urgency / Priority Level Management (ការគ្រប់គ្រងកម្រិតអាទិភាព & ភាពបន្ទាន់)**:
  - Configure urgency tiers with unique codes (e.g., `PRI-URG`, `PRI-HIGH`), key identifiers, bilingual titles, and target turnaround SLA in hours (e.g., 24h, 48h, 72h).
  - Customizable color themes (Red, Orange, Amber, Blue, Green, Purple, Slate) with dynamic badge rendering and pulse dot indicators for fast-track SLAs.
  - Safe deletion safeguards preventing removal of priority tiers assigned to active requisitions.
  - Seamless synchronization across Requisition Boards, Priority Breakdown Pills, and Requester Dashboards.
- **Category List (បញ្ជីប្រភេទទំនិញ)**: Manage procurement categories with codes, bilingual names, descriptions, item counts, and status (Active/Inactive).
- **Item Catalog (កាតាឡុកទំនិញ)**: Standardized item database with item codes, names, units (Unit, Box, Pcs, Set, Pack), estimated unit pricing, and category linkage.
- **User Management (ការគ្រប់គ្រងអ្នកប្រើប្រាស់)**: Manage department accounts, emails, and assigned roles.

### 5. Seamless Bilingual Switching (ភាសាខ្មែរ & English)
- One-click toggle in the header between 🇰🇭 **ភាសាខ្មែរ** and 🇬🇧 **English**.
- Fully translated labels, forms, badges, KPI metrics, modal dialogues, and notifications.
- Optimized typography with Google Font **Kantumruy Pro** & **Inter**.

### 6. Additional Capabilities
- **Print / PDF Voucher**: Clean, professional procurement requisition order print stylesheet.
- **Data Persistence**: Uses `localStorage` to preserve all additions and status changes across browser sessions.
- **Export to CSV**: Download requisition data directly to Excel/CSV.
- **Reset Sample Data**: Easily restore initial demo data at any time.

---

## 🚀 How to Run the Application

### Option 1: Open Directly in Any Web Browser
Simply double-click `index.html` or right-click -> **Open with Google Chrome / Microsoft Edge**.

### Option 2: Run with Built-in Lightweight Node Server
Run the included zero-dependency server:
```powershell
node server.js
```
Then open your browser to:
[http://localhost:3000](http://localhost:3000)

---

## 📤 How to Push this Project to GitHub from Antigravity

### Method 1: Using Antigravity Terminal
1. Open the terminal (`Ctrl + ` ` `).
2. Configure your Git user (if not done yet):
   ```powershell
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```
3. Initialize git and commit:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit: Procurement application with bilingual support, priority KPI, and master list management"
   ```
4. Create a new repository on GitHub: [github.com/new](https://github.com/new) (e.g. `procurement-system`).
5. Connect your remote repository and push:
   ```powershell
   git branch -M main
   git remote add origin https://github.com/<your-username>/procurement-system.git
   git push -u origin main
   ```

### Method 2: Using Antigravity Source Control UI
1. Click the **Source Control** icon on the left activity bar (or press `Ctrl + Shift + G`).
2. Click **Initialize Repository**.
3. Stage changes by clicking `+`, type `Initial commit`, and commit.
4. Click **Publish to GitHub**.
"# procurement-system" 
