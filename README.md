# ProcureFlow - Procurement Management Application (ប្រព័ន្ធគ្រប់គ្រងលទ្ធកម្ម)

A full-featured, bilingual (**English** & **Khmer / ភាសាខ្មែរ**) Procurement Management System designed to handle departmental purchase requisitions, priority tracking with real-time KPI metrics, role-based workflows for Management and Administrators, and master list management.

---

## 🌟 Key Features

### 1. Department Requisition Form (ទម្រង់ស្នើសុំលទ្ធកម្ម)
- **Department Selection**: Pre-configured for IT, HR, Finance, Operations, Logistics, Marketing, Administration, and Procurement.
- **Requester Information**: Name, Email, Request Date, Required-by Date, and Business Justification.
- **Dynamic Line Items**:
  - Auto-complete selection from the Item Catalog (auto-populating Category, Unit, and Estimated Unit Price).
  - Ability to add Custom non-catalog items with specifications.
  - Real-time subtotal and grand total calculation.
  - Auto-generated sequential Requisition ID (`REQ-2026-001`, `REQ-2026-002`, etc.).

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

### 4. Master List Management (ការគ្រប់គ្រងបញ្ជីទិន្នន័យមេ)
- **Category List**: Manage procurement categories with codes, bilingual names, descriptions, item counts, and status (Active/Inactive).
- **Item Catalog**: Standardized item database with item codes, names, units (Unit, Box, Pcs, Set, Pack), estimated unit pricing, and category linkage.
- **User Management**: Manage department accounts, emails, and assigned roles.

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
