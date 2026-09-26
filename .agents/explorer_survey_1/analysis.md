# Architecture & UI/UX Audit Report: Dunia_Kampus (Aplikasi Dosen - RPS)

**Author:** Explorer Survey 1 (Architecture & UI/UX Audit)  
**Date:** 2026-09-24  
**Target Domain:** `kampus.rumahku.web.id` (Target VPS: `38.103.170.236`)  
**Target Role:** Dosen (Lecturer)  
**Main Feature:** RPS (Rencana Pembelajaran Semester)  

---

## Executive Summary

An exhaustive technical audit was conducted on the codebase located at `c:\xampp\htdocs\Aplikasi_Dosen`. 

### Key Findings:
1. **Frontend Build Failure**: The React application (`apps/web`) fails TypeScript compilation (`tsc && vite build`) due to unused variables, untyped parameters, and duplicate switch cases under strict compiler rules.
2. **Disconnected Mockups**: The frontend UI is largely an unlinked mockup. The Dashboard displays static dummy data (`dummyDocs`); the 9-step Wizard uses uncontrolled inputs (`defaultValue`) and submits hardcoded JSON mock data regardless of user input; the "Simpan Draft" button is a dead element.
3. **Severe UI Glitches**: 
   - Visiting `/settings` renders two nested sidebars simultaneously because `TemplateSettingsMockup.tsx` re-implements a sidebar that is already rendered by `App.tsx`'s `<Layout>`.
   - On mobile viewports (< 768px), the sidebar is hidden and the hamburger menu icon has no click listener or drawer state, rendering the app completely inaccessible on mobile.
4. **Backend Anti-Patterns & Security Holes**:
   - `apps/api/src/server.ts` is a 166-line monolith. All architectural subdirectories (`controllers/`, `routes/`, `services/`, `validators/`, `templates/`, `exporters/`) are 100% empty scaffolding.
   - **Command Injection**: PDF export executes unsanitized shell commands (`soffice --headless ...`) via `child_process.exec()` using user-supplied course codes.
   - **Arbitrary Template Overwrite**: `/api/templates/upload` allows unauthenticated, unverified `.docx` uploads that overwrite the production template `rps-template-processed.docx` with zero schema verification.
   - **Race Conditions & Data Dropping**: PDF export depends on previously exported files on disk rather than rendering on-demand. Furthermore, Docxtemplater only binds 10 basic metadata fields; all CPL/CPMK, weekly course plans, evaluation percentages, and references are dropped during DOCX export.
5. **Hardcoded Environment URLs**: All frontend components hardcode `http://localhost:3000`. Deploying this to `kampus.rumahku.web.id` will cause total application breakdown in client browsers.

---

## 1. Codebase Catalog & Tech Stack Inventory

### 1.1 Directory Tree Overview
```text
c:\xampp\htdocs\Aplikasi_Dosen\
├── .agents/                               # Multi-agent coordination metadata
├── docs/                                  # Architectural & template documentation
│   ├── document-structure.md             # Breakdown of RPS Word document
│   ├── form-fields.md                    # Field inventory extracted from DOCX
│   └── template-fidelity-report.md       # Fidelity comparison report
├── 6. RPS Logika matematika genap...docx  # Master benchmark DOCX (75.5 KB)
├── docx_structure.json                   # Raw XML table dump
├── venv/                                 # Local Python environment for DOCX inspection
└── rps-form-app/                         # Main Application Monorepo
    ├── package.json                      # Workspace root (npm workspaces: apps/*)
    ├── docker-compose.yml                # PostgreSQL config (Out of sync with SQLite)
    ├── .env / .env.example               # Root environment variables
    ├── prisma/
    │   ├── dev.db                        # Physical SQLite Database (32 KB, 4 records)
    │   └── schema.prisma                 # Prisma schema (User, RpsDocument, Template)
    ├── storage/
    │   ├── drafts/                       # Local draft storage
    │   ├── exports/                      # DOCX/PDF output folder
    │   └── uploads/                      # Temp upload folder
    ├── templates/
    │   ├── original/rps-template.docx
    │   ├── processed/rps-template-processed.docx
    │   └── preview/
    ├── scripts/
    │   └── doctor.js                     # Health check script
    ├── apps/
    │   ├── api/                          # Express + TypeScript API Backend
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   ├── clean_docx.js             # Loose ad-hoc script
    │   │   ├── generate_filled_template.js
    │   │   └── src/
    │   │       ├── server.ts             # Monolithic entrypoint (166 lines)
    │   │       ├── controllers/          # [EMPTY]
    │   │       ├── exporters/            # [EMPTY]
    │   │       ├── routes/               # [EMPTY]
    │   │       ├── services/             # [EMPTY]
    │   │       ├── templates/            # [EMPTY]
    │   │       └── validators/           # [EMPTY]
    │   └── web/                          # React + Vite + Tailwind Frontend
    │       ├── package.json
    │       ├── vite.config.ts
    │       ├── tsconfig.json
    │       ├── fix_app.js                # Loose patch script
    │       └── src/
    │           ├── App.tsx               # Main routing & layout
    │           ├── main.tsx              # React DOM entry
    │           ├── index.css             # Tailwind base
    │           ├── pages/
    │           │   ├── Dashboard.tsx               # Abandoned API test stub
    │           │   ├── DashboardMockup.tsx         # Static mockup dashboard
    │           │   ├── WizardMockup.tsx            # Static 9-step wizard mockup
    │           │   └── TemplateSettingsMockup.tsx  # Template settings with duplicate sidebar
    │           ├── components/ [ui/ is EMPTY]
    │           ├── forms/      [EMPTY]
    │           ├── hooks/      [EMPTY]
    │           ├── layouts/    [EMPTY]
    │           ├── services/   [EMPTY]
    │           ├── stores/     [EMPTY]
    │           ├── types/      [EMPTY]
    │           └── utils/      [EMPTY]
```

### 1.2 Technology Stack
| Layer | Technologies Declared | Status / Observed Reality |
|---|---|---|
| **Runtime / OS** | Node.js v24.13.1, Windows (Dev), Ubuntu Linux (Target VPS `38.103.170.236`) | Active |
| **Monorepo** | NPM Workspaces (`apps/api`, `apps/web`), Concurrently | Active |
| **Database** | Prisma ORM 5.11.0, SQLite (`prisma/dev.db`) | SQLite active; `docker-compose.yml` specifies PostgreSQL (conflicted) |
| **Backend Framework** | Express 4.19.2, TypeScript 5.2.2, ts-node-dev | Working, but concentrated in a single monolithic `server.ts` file |
| **Document Processing** | Docxtemplater 3.71.0, PizZip 3.3.0, LibreOffice (`soffice`) | DOCX working partially; LibreOffice missing on local Windows dev environment |
| **Frontend Framework** | React 18.2.0, Vite 5.2.0, TypeScript 5.2.2, Tailwind CSS 3.4.1 | Broken build (`tsc` errors); running only under relaxed dev server |
| **Icons & UI** | Lucide React 0.359.0 | Active |
| **Form & State Management** | React Hook Form 7.51.1, Zod 3.22.4, Zustand 4.5.2, Axios 1.6.8 | Installed in `package.json`, but ZERO usage in source code! |

---

## 2. Architecture, Coupling, Security & Database Audit

### 2.1 Monolithic Architecture & Scaffold Abandonment
The project shows clear evidence of premature abandonment of a structured modular design. 
- In `apps/api/src/`:
  - `controllers/`, `exporters/`, `routes/`, `services/`, `templates/`, `validators/` are all empty folders.
  - All logic is crammed into `apps/api/src/server.ts`.
- In `apps/web/src/`:
  - `components/ui/`, `forms/`, `hooks/`, `layouts/`, `services/`, `stores/`, `types/`, `utils/` are completely empty.
  - All form handling is merged into `WizardMockup.tsx` (452 lines).

### 2.2 Security Vulnerabilities

#### Vulnerability 1: Command Injection in PDF Export (High Severity)
- **Location**: `apps/api/src/server.ts`, lines 128-137
- **Code Snippet**:
  ```typescript
  const latestDocx = path.join(exportDir, files[files.length - 1]);
  const cmd = 'soffice --headless --convert-to pdf "' + latestDocx + '" --outdir "' + exportDir + '"';
  exec(cmd, (err, stdout, stderr) => { ... });
  ```
- **Risk Analysis**: `files` is filtered by `f.startsWith("RPS_" + docData.courseCode)`. `courseCode` is a user-controlled string received during RPS creation/updating. If an attacker inputs a course code with shell metacharacters (e.g. `MKK"; rm -rf / ; #`), the unescaped concatenation into `exec()` allows arbitrary remote code execution on the VPS.
- **Remediation**: Use `child_process.execFile` with an argument array instead of `exec` with a raw string, and sanitize all file naming inputs strictly with alphanumeric and hyphen whitelist (`/^[A-Za-z0-9_-]+$/`).

#### Vulnerability 2: Arbitrary Template Overwrite & Permanent DoS (High Severity)
- **Location**: `apps/api/src/server.ts`, lines 143-160 (`POST /api/templates/upload`)
- **Code Snippet**:
  ```typescript
  const targetPath = path.resolve(__dirname, '../../../templates/processed/rps-template-processed.docx');
  fs.copyFileSync(req.file.path, targetPath);
  ```
- **Risk Analysis**: 
  - There is zero authentication or authorization check. Anyone can reach this endpoint.
  - There is zero validation of document content or XML structure.
  - Uploading a corrupted file immediately overwrites the production template. Every subsequent DOCX export request will crash with a 500 error.
- **Remediation**: Store uploaded templates with unique IDs/versions in the database (using the existing `Template` model), validate the `.docx` zip structure and XML placeholders before activating, and keep the default template immutable as a fallback.

#### Vulnerability 3: Open CORS Configuration
- **Location**: `apps/api/src/server.ts`, line 15
- **Code Snippet**:
  ```typescript
  app.use(cors());
  ```
- **Risk Analysis**: Accepts requests from any origin. Although `CORS_ORIGIN="http://localhost:5173"` is defined in `.env`, `server.ts` completely ignores the environment variable.

### 2.3 Database Physical State & PDO Safety Rules
- **Physical SQLite Verification** (`node -e ... prisma physical query`):
  - Database file: `rps-form-app/prisma/dev.db` (32,768 bytes).
  - `User` table: **0 records** (empty).
  - `Template` table: **0 records** (empty).
  - `RpsDocument` table: **4 records**, all titled `"Draft Logika Matematika"`, courseCode `"MKK209"`, status `"DRAFT"`.
- **Schema Deficiencies**:
  - `RpsDocument` has no relation to `User` (`userId` is absent).
  - `dataJson` is an untyped text column. There is no schema validation for JSON payloads, risking corrupted JSON states.
  - The `Template` model is declared in `schema.prisma` with `placeholderSchema` and `isActive`, but is never utilized in application code.
- **PDO & Database Guidelines Compliance**:
  - Note: The current backend is built in Node.js with Prisma ORM, so native PHP PDO is not currently running.
  - However, in accordance with user rules (`RULE[user_global]` Rule 4) and prospective PHP/PDO service integration or direct SQL queries: **Named parameters must NEVER be reused in PDO statements** (e.g. use `:id_1`, `:id_2` instead of repeating `:id`). Prisma query builder handles parameterized queries automatically, but any raw queries (`$queryRaw`) must adhere strictly to parameter safety.

### 2.4 Race Conditions & Broken Document Export
- **PDF Export Disconnected from Document ID**:
  - `/api/rps/:id/export/pdf` reads `storage/exports` and picks whatever file starts with `RPS_${courseCode}`.
  - If a user modifies document details and clicks "Export PDF", the server returns the previously exported DOCX file or fails if DOCX export wasn't executed beforehand.
  - Multiple users exporting documents with identical course codes will overwrite each other's files.
- **Data Dropping in Docxtemplater**:
  - In `server.ts:77-88`, only 10 fields are injected into `templateData`: `INSTITUSI`, `PROGRAM_STUDI`, `NAMA_MATA_KULIAH`, `KODE_MATA_KULIAH`, `SKS_T`, `SKS_P`, `SKS`, `TANGGAL_PENYUSUNAN`, `DOSEN_PENGEMBANG`, `KOORDINATOR_MATA_KULIAH`.
  - All form data entered in Steps 3 through 8 (CPL, CPMK, Sub-CPMK, Bahan Kajian, Metode Pembelajaran, 16-Week Lesson Plan, Penilaian percentages, Referensi) are **completely discarded** by the export engine!

---

## 3. UI/UX & Web Usability Audit

### 3.1 Critical Visual & Layout Bugs

#### Bug 1: Nested Double Sidebar on Settings Page
- **Observation**: When navigating to `/settings`, two complete sidebars appear side by side.
- **Cause**: `App.tsx` wraps all routes inside `<Layout>`, which renders `<Sidebar />`. However, `TemplateSettingsMockup.tsx` lines 30-51 also renders its own hardcoded `<div className="w-64 bg-[#2b3a8c]...">` sidebar.
- **Impact**: Severe visual degradation and broken layout hierarchy.

#### Bug 2: Inoperable Mobile Navigation (Usability Blocker)
- **Observation**: On screen widths < 768px:
  - The desktop sidebar is hidden (`hidden md:flex`).
  - A mobile topbar is displayed with a hamburger icon (`<Menu className="w-6 h-6 text-gray-600" />`, `App.tsx:50`).
  - Clicking the hamburger icon has NO effect whatsoever.
- **Cause**: The `<Menu />` icon has no `onClick` handler, and there is no state variable (`isMobileMenuOpen`) or mobile drawer navigation component.
- **Impact**: Mobile users cannot navigate to any other page in the application.

### 3.2 Form Usability & State Disconnection

#### Issue 1: Uncontrolled Inputs & Data Discarding in Wizard
- **Observation**: All 9 steps in `WizardMockup.tsx` use uncontrolled HTML inputs with `defaultValue="..."`.
- **Cause**: No React state (`useState`) or form library (`react-hook-form`) is bound to the form fields.
- **Impact**: 
  - Any edits made by the lecturer are never captured.
  - Clicking "Ekspor ke DOCX" or "Ekspor ke PDF" calls `saveMockDataAndGetId()`, which sends a hardcoded mock JSON payload to `/api/rps`.
  - The "Simpan Draft" button (`WizardMockup.tsx:437`) has NO `onClick` handler.

#### Issue 2: Duplicate Switch Cases & Scrambled Steps
- **Observation**: In `WizardMockup.tsx`:
  - `case 4:` is declared twice (line 205: "Bahan Kajian & Materi", line 294: "Bahan Kajian").
  - The switch cases appear out of sequence: `1, 2, 3, 4, 6, 9, 4, 5, 7, 8`.
  - Step 6 (Weekly Lesson Plan) only renders Week 1; the "+ Tambah Baris Pertemuan" button does nothing.
  - Step 3 (CPL) "+ Tambah Baris CP" and delete trash icons do nothing.

#### Issue 3: Hardcoded Server URLs
- The frontend hardcodes `http://localhost:3000` in:
  - `Dashboard.tsx:8`
  - `WizardMockup.tsx:24, 51, 66, 68`
  - `TemplateSettingsMockup.tsx:19`
- **Impact**: Once deployed to `kampus.rumahku.web.id`, all client browser requests will attempt to reach `localhost:3000` on the visitor's local machine, causing network errors.

### 3.3 Accessibility (a11y) & Design Standard Deficits
- **WCAG Contrast Ratios**: Muted text classes (`text-gray-400`, `text-blue-300`) on white and light blue backgrounds fail WCAG AA 4.5:1 minimum contrast.
- **Form Semantics**: Form inputs lack corresponding `<label htmlFor="...">` bindings and `id` attributes.
- **Interactive Semantics**: The "+ Tambah Baris Pertemuan" in Step 6 is an unsemantic `<td>` with `cursor-pointer`, inaccessible via keyboard navigation (`Tab` / `Enter`).
- **Feedback & Error States**: The app uses native `window.alert()` instead of accessible toast notifications or inline error messages.

---

## 4. Comprehensive Feature Inventory

| Feature Item | Declared / Target Specification | Current Codebase Status | Issues / Deficiencies |
|---|---|---|---|
| **Lecturer Authentication / Profile** | Role: Dosen (Dunia_Kampus); Profile display & session | ❌ Non-existent | Hardcoded as "Admin Akademik" in `App.tsx:38`. No auth, no JWT/session, no user relation. |
| **RPS Dashboard List** | Real-time list of lecturer's RPS documents with search & filter | ⚠️ Broken Mockup | Displays hardcoded `dummyDocs`. Search & filter inputs are non-functional. `MoreVertical` button has no menu. |
| **RPS Dashboard Stats** | Total Dokumen, Draft Menunggu, Selesai & Diekspor | ⚠️ Hardcoded | Hardcoded numbers (12, 3, 9) in `DashboardMockup.tsx:32, 41, 50`. |
| **RPS Creation (New)** | Initialize a new blank RPS document | ⚠️ Broken Mockup | Navigates to `/wizard`, but wizard always loads pre-filled Logika Matematika data. |
| **RPS Multi-step Wizard** | 9 structured steps for full RPS document creation | ⚠️ Broken Mockup | Uncontrolled inputs, duplicate switch case 4, out-of-order cases, dead buttons for adding/removing rows. |
| **Step 1: Identitas MK** | Perguruan Tinggi, Prodi, Nama MK, Kode MK, SKS T/P, Semester | ⚠️ Mockup Only | Uncontrolled `defaultValue`. |
| **Step 2: Dosen & Pengesahan** | Tanggal, Dosen Pengembang, Koordinator RMK, Kaprodi | ⚠️ Mockup Only | Uncontrolled `defaultValue`. |
| **Step 3: Capaian Pembelajaran** | Dynamic table of CPL-PRODI, CPMK, Sub-CPMK | ⚠️ Static Mockup | Add and Delete buttons have no handlers. |
| **Step 4: Bahan Kajian** | List of study materials / topics | ⚠️ Duplicate Code | Declared twice in switch statement. |
| **Step 5: Metode Pembelajaran** | Checkboxes for Ceramah, Diskusi, PjBL, CBL | ⚠️ Static Mockup | Uncontrolled checkboxes. |
| **Step 6: Rencana Mingguan** | 16-week matrix (Sub-CPMK, Indikator, Metode, Materi, Bobot) | ⚠️ Static Mockup | Only renders Week 1. Add row is non-functional. Bobot total is hardcoded text (4%). |
| **Step 7: Penilaian** | Evaluation weights (Tugas, Kuis, UTS, UAS = 100%) | ⚠️ Static Mockup | Static inputs, no dynamic calculation or validation. |
| **Step 8: Referensi Pustaka** | Pustaka Utama & Pustaka Pendukung | ⚠️ Mockup Only | Static textareas. |
| **Step 9: Pratinjau & Validasi** | Completeness summary check & export triggers | ⚠️ Mockup Only | Checklist is hardcoded green. "Simpan Draft" does nothing. |
| **DOCX Export** | Generate `.docx` file matching master RPS template | ⚠️ Partially Working | Only binds 10 header fields. Discards all lesson plan tables and learning outcomes. |
| **PDF Export** | Convert generated DOCX to PDF via LibreOffice | ❌ Fragile / Inoperable | Command injection vulnerability; requires previous DOCX export; LibreOffice missing on dev machine. |
| **Template Management** | Upload and activate custom DOCX templates | ❌ Vulnerable Mockup | Unauthenticated file upload, overwrites master file, no database tracking. |
| **Responsive Mobile Layout** | Usable on mobile and tablet screens | ❌ Broken | Hamburger menu does nothing; app is trapped on mobile. |
| **AI Agent Communication (R2)** | API/context endpoints for cross-platform agent sync | ❌ Missing | No AI endpoints, no context provider files. |
| **AI Continuous Learning (R2)** | Persistent logging & feedback tables for AI debugging | ❌ Missing | No AI error log table or feedback mechanism in Prisma schema. |
| **VPS Deployment Automation (R3)** | Automated zip, upload, and extract script to `38.103.170.236` | ❌ Missing | No deployment script; `.env` not configured for `kampus.rumahku.web.id`. |

---

## 5. Concrete Architecture Refactoring Proposal

To transform this repository into a high-level, production-ready system for the **Dosen** role in **Dunia_Kampus** deployed at **`kampus.rumahku.web.id`**, the following architecture is proposed.

### 5.1 System Architecture Overview

```text
+-------------------------------------------------------------------------------+
|                             CLIENT BROWSER                                    |
|                       (kampus.rumahku.web.id)                                 |
+---------------------------------------+---------------------------------------+
                                        | HTTPS / HTTP
                                        v
+-------------------------------------------------------------------------------+
|                             NGINX REVERSE PROXY                               |
|              - Static assets: / -> apps/web/dist                              |
|              - API proxy:     /api -> http://127.0.0.1:3000                   |
+---------------------------------------+---------------------------------------+
                                        | Internal Proxy
                                        v
+-------------------------------------------------------------------------------+
|                       BACKEND EXPRESS API (apps/api)                          |
|                                                                               |
|  +--------------------+  +---------------------+  +------------------------+  |
|  |   Middlewares      |  |     Controllers     |  |       Services         |  |
|  | - Error Handler    |  | - RpsController     |  | - RpsService           |  |
|  | - Auth / Dosen Role|  | - TemplateController|  | - DocxExportService    |  |
|  | - Zod Validator    |  | - AiEcosystemCtrl   |  | - PdfExportService     |  |
|  +--------------------+  +---------------------+  | - AiLearningService    |  |
|                                                   +------------------------+  |
|                                                               |               |
|                                                               v               |
|                                                   +------------------------+  |
|                                                   |      Prisma ORM        |  |
|                                                   |  (SQLite / PostgreSQL) |  |
|                                                   +------------------------+  |
+-------------------------------------------------------------------------------+
```

### 5.2 Layered Backend Restructuring (`apps/api`)
Break down the monolithic `server.ts` into a clean MVC / Service-Repository pattern:

1. **`src/routes/`**:
   - `rps.routes.ts`: CRUD endpoints (`GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `GET /:id/export/docx`, `GET /:id/export/pdf`).
   - `template.routes.ts`: Template management (`GET /`, `POST /upload`, `POST /:id/activate`).
   - `ai.routes.ts`: Cross-platform AI interaction (`GET /context`, `POST /logs`, `POST /feedback`).
   - `index.ts`: Central route registration with `/api` prefix.
2. **`src/controllers/`**:
   - Pure request-response mapping, calling corresponding service layer methods, returning standard JSON envelope: `{ success: true, data: ..., message: ... }`.
3. **`src/services/`**:
   - `RpsService.ts`: Business logic for RPS documents, calculation of completion percentage.
   - `DocxExportService.ts`: On-demand Docxtemplater compilation. Injects full structured data:
     - Header & Otorisasi
     - CPL-PRODI, CPMK, Sub-CPMK loops (`{#cpl}...{/cpl}`)
     - 16-Week lesson plan table loops (`{#rencanaMingguan}...{/rencanaMingguan}`)
     - Penilaian percentage matrix
     - Referensi list
   - `PdfExportService.ts`: Generates DOCX in memory/temp, invokes `soffice` safely via `execFile` with argument array, cleans up temp files automatically.
   - `AiLearningService.ts`: Stores agent interaction traces, errors, and system feedback.
4. **`src/validators/`**:
   - `rps.validator.ts`: Comprehensive Zod schemas for incoming RPS payloads.
5. **Database Enhancements (`prisma/schema.prisma`)**:
   - Link `RpsDocument` with `User` (`dosenId`).
   - Add `AiLog` and `AiFeedback` tables for R2 compliance:
     ```prisma
     model AiLog {
       id        String   @id @default(uuid())
       agentId   String
       action    String
       status    String
       errorMsg  String?
       metadata  String?  // JSON
       createdAt DateTime @default(now())
     }

     model AiFeedback {
       id        String   @id @default(uuid())
       prompt    String
       solution  String
       success   Boolean
       notes     String?
       createdAt DateTime @default(now())
     }
     ```

### 5.3 Modern Reactive Frontend Restructuring (`apps/web`)
1. **Fix Layout & Responsive Shell**:
   - Single layout wrapper in `layouts/AppLayout.tsx`.
   - Remove duplicate sidebar from `TemplateSettingsMockup.tsx`.
   - Add mobile slide-over drawer toggle (`isMobileMenuOpen`) triggered by the header hamburger button.
   - Update branding from generic "RPS Builder" to **Dunia Kampus - Portal Dosen**.
2. **Dynamic State Management**:
   - Use `zustand` store (`stores/useRpsStore.ts`) to manage wizard draft state across all 9 steps.
   - Implement `localStorage` auto-save so lecturers don't lose work when switching steps or refreshing.
3. **Dynamic Wizard Form**:
   - Create isolated step components under `forms/steps/`:
     - `Step1Identitas.tsx`
     - `Step2Pengesahan.tsx`
     - `Step3Capaian.tsx` (dynamic add/remove rows)
     - `Step4BahanKajian.tsx`
     - `Step5Metode.tsx`
     - `Step6RencanaMingguan.tsx` (full 16-week matrix repeater with real-time total bobot calculation)
     - `Step7Penilaian.tsx` (automatic 100% sum validation)
     - `Step8Referensi.tsx`
     - `Step9Pratinjau.tsx` (live validation summary, true DOCX/PDF export triggers)
4. **Environment-Aware API Client**:
   - Implement `services/api.ts` using Axios with `baseURL: import.meta.env.VITE_API_URL || '/api'`.
   - Configure Vite proxy in `vite.config.ts`:
     ```typescript
     server: {
       proxy: {
         '/api': 'http://localhost:3000'
       }
     }
     ```
   - Resolve all TypeScript compiler errors (`strict` mode compliance) so `npm run build` succeeds cleanly.

### 5.4 VPS Deployment & Runtime Architecture (R3)
- **Target Host**: `38.103.170.236` | **Domain**: `kampus.rumahku.web.id`
- **Isolation Constraint**: The VPS hosts other projects. Must deploy inside an isolated path (e.g. `/var/www/dunia_kampus_dosen` or `/var/www/kampus.rumahku.web.id`).
- **SOP Adherence**:
  1. Build both `apps/web` and `apps/api`.
  2. Package into `web_build.zip` locally.
  3. Upload zip via SSH / scp (single archive, strictly no raw `scp -r`).
  4. Extract on remote server with `unzip -o web_build.zip`.
  5. Fallback auto-fix script (`fix_server.php`) if terminal SSH is restricted.
  6. Dedicated Nginx server block for `server_name kampus.rumahku.web.id`.
  7. Process manager: Run Node backend via PM2 (`pm2 start dist/server.js --name dunia-kampus-api`).

---

## 6. Audit Summary Matrix

| Audit Domain | Current State | Target Future State | Priority |
|---|---|---|---|
| **Compilation & Build** | ❌ Broken (`tsc` errors in `apps/web`) | ✅ Zero-error production build (`npm run build`) | P0 (Critical) |
| **API URL Configuration** | ❌ Hardcoded `localhost:3000` | ✅ Relative `/api` with proxy and `.env` support | P0 (Critical) |
| **Layout & Mobile UX** | ❌ Double sidebar on settings; dead hamburger | ✅ Clean responsive shell with functional mobile drawer | P0 (Critical) |
| **Wizard State & Form** | ⚠️ Static mockup with discarded user input | ✅ Reactive Zustand store, dynamic row addition, auto-save | P0 (Critical) |
| **DOCX/PDF Export** | ⚠️ Missing fields, command injection risk | ✅ Full template field mapping, safe child_process execution | P1 (High) |
| **Backend Architecture** | ❌ 166-line monolith with empty folders | ✅ Modular MVC (routes, controllers, services, validators) | P1 (High) |
| **Security & Validation** | ❌ Unauthenticated template overwrite, open CORS | ✅ Zod validation, role guards, template versioning | P1 (High) |
| **AI Ecosystem & Learning** | ❌ Missing | ✅ `/api/ai` context endpoint, `AiLog` database table | P1 (High) |
| **Deployment Automation** | ❌ Missing deployment script | ✅ Single-command zip & deploy script for VPS SOP | P1 (High) |

