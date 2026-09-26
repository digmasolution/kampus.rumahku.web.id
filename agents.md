# agents.md — Central Command Index for AI Agents

> **Project**: Dunia_Kampus — Aplikasi Dosen (Rencana Pembelajaran Semester / RPS Builder)  
> **Target Domain**: `kampus.rumahku.web.id`  
> **Production VPS**: `38.103.170.236` (Strictly isolated at `/var/www/kampus-dosen`)  
> **Version**: 1.0.0 (OBE & SN-Dikti Compliant)

---

## 1. 🔒 Mandatory Golden Rules

All agents, subagents, and automated workers operating in this repository MUST strictly obey these rules:

### Rule 1: Prevent "God Code" (SRP & Modularity)
- Enforce Single-Responsibility Principle (SRP) across all layers.
- Avoid monolithic files or gigantic single functions.
- Keep strict separation of concerns:
  - **Routes** (`apps/api/src/routes/`): Pure endpoint mapping and middleware binding.
  - **Controllers** (`apps/api/src/controllers/`): HTTP request parsing, status codes, response formatting.
  - **Services** (`apps/api/src/services/`): Business logic, database interactions, third-party integrations.
  - **Validators** (`apps/api/src/validators/`): Strict Zod schema definitions and input sanitization.
  - **Middleware** (`apps/api/src/middleware/`): Authentication, error handling, logging.
  - **Frontend UI** (`apps/web/src/`): Modular atomic components, custom hooks, and zustand stores.

### Rule 2: Prevent Backdoors & Security Debt
- **Zero hardcoded bypasses**: Never insert test tokens, backdoor passwords, or magic bypass conditions in production or test paths.
- **Genuine Agent Authentication**: All `/api/v1/ai/*` routes require genuine `X-Agent-Key` or `Authorization: Bearer <token>` validation.
- **Input Sanitization**: Strip shell metacharacters and path traversal sequences (`../`, `..\`) from user inputs and filenames.
- **Secret Protection**: Never bundle `.env` files or private credentials into distribution archives (`web_build.zip`).

### Rule 3: Automated Safe VPS Deployment (WSL SSH Key & Zip SOP)
- **Otomatisasi Penuh via WSL SSH Key**: Lingkungan lokal user telah terkonfigurasi SSH public key di **WSL** (`wsl -d Ubuntu bash -c "ssh root@38.103.170.236 ..."`). AI WAJIB mengeksekusi deployment secara otomatis tanpa meminta password/interaksi manual user.
- **HINDARI `scp -r`**: Dilarang meng-upload folder mentah secara rekursif over SSH.
- **WAJIB KOMPRESI**: Selalu build lokal (Windows/PowerShell), kompres ke `web_build.zip`, lalu upload dan ekstrak di server via WSL SSH menggunakan `unzip -o`.
- **Multi-Tenant Protection (Syukran & Tenants Lain)**:
  - VPS `38.103.170.236` memiliki tenant aktif: `/var/www/syukran-laravel/` (Backend Syukran) dan `/var/www/html/` (Frontend Syukran).
  - DILARANG KERAS menyentuh, membaca, atau memodifikasi `/var/www/syukran-laravel/` dan `/var/www/html/`.
  - Aplikasi Dunia_Kampus ditempatkan EKSKLUSIF di `/var/www/kampus-dosen/`.
  - VirtualHost Apache: Gunakan file dedicated `/etc/apache2/sites-available/kampus.conf` dengan ServerName `kampus.rumahku.web.id` dan port reverse proxy 3005. Jangan pernah mengubah config global apache maupun config tenant lain.
- **Auto-Fix Recovery**: Sediakan `fix_server.php` di project root untuk 1-click self-extracting HTTP recovery jika SSH atau daemon butuh repair.

### Rule 4: Database & PDO Safety
- **Anti-Hallucination 3-Layer Check**: Physical Database (SQLite schema/query) ↔ API Response (JSON structure) ↔ Frontend Model (Zod/TypeScript types) must always remain strictly synchronized.
- **Named Parameter Safety**: Never duplicate named parameters in single prepared statements to avoid fatal driver errors.

### Rule 5: Cross-Platform & Pipe Deadlock Prevention
- **WSL-to-Windows Pipe Rule**: Never run Windows binaries from WSL and pipe output into Linux tools (`cmd.exe /c 'binary.exe' | grep`). Run Windows binaries in PowerShell/CMD, and use WSL only for native Linux utilities.
- **No PowerShell UTF-8 BOM**: Never use `Set-Content -Encoding UTF8` which injects `\xEF\xBB\xBF`. Use `write_to_file` or Python utf-8 writer.

---

## 2. Global Project Overview

**Dunia_Kampus** is an automated Outcome-Based Education (OBE) course syllabus and Rencana Pembelajaran Semester (RPS) generation platform tailored to Indonesian higher education standards (SN-Dikti & Permendikbudristek).

### Core Capabilities
1. **Dynamic Matrix Builder**: 16-week lecture matrix builder with midterm exam (Week 8) and final exam (Week 16) milestones.
2. **Pedagogical Alignment**: Form-driven mapping between CPL (Capaian Pembelajaran Lulusan), CPMK (Capaian Pembelajaran Mata Kuliah), and Sub-CPMK.
3. **Assessment Calculation**: Real-time evaluation weighting ensuring 100% cumulative weight compliance.
4. **Export Engine**:
   - High-fidelity Microsoft Word export using `docxtemplater` and `pizzip` with isolated XML table layouts.
   - Headless PDF conversion via LibreOffice Writer.
5. **AI DX & Telemetry Ecosystem**:
   - Complete agent introspection API (`/api/v1/ai/context`).
   - Action Hub RPC (`/api/v1/ai/actions/execute`).
   - Dual-pipe logging (queryable SQLite DB + append-only JSONL files).
   - Continuous learning memory and issue-to-technical-fix registry.

---

## 3. Directory Map & Monorepo Structure

```
c:\xampp\htdocs\Aplikasi_Dosen\
├── .agents/                        # Multi-agent coordination metadata & reports (NEVER put source code here)
│   ├── orchestrator_1/             # Root Project Orchestrator
│   ├── worker_m1_1/                # Worker M1 (Architecture & UI)
│   ├── worker_m2_1/                # Worker M2 (AI DX Ecosystem)
│   └── worker_m3_1/                # Worker M3 (VPS Deployment & Central Command Index)
├── agents.md                       # THIS FILE: Central Command Index for AI Agents
├── PROJECT.md                      # Milestone roadmap, architecture contracts, feature inventory
├── ORIGINAL_REQUEST.md             # Immutable user requirements and specifications
├── deploy.ps1                      # Automated Windows PowerShell deployment script (ZIP + SCP + SSH)
├── deploy.sh                       # Automated Linux/WSL Bash deployment script
├── fix_server.php                  # Standalone 1-click self-extracting HTTP recovery script
├── kampus.conf                     # Apache 2.4 VirtualHost config (reverse proxy port 3005)
├── kampus-api.service              # Systemd daemon service unit for Node.js API
├── web_build.zip                   # Packaged production release artifact
├── tests/                          # Automated E2E verification test suite (Tiers 1 to 4)
│   ├── runner.js                   # Unified test runner (`node tests/runner.js`)
│   ├── test_helper.js              # Zero-dependency HTTP client & process controller
│   ├── tier1_feature/              # Tier 1: Core CRUD, export, AI DX, logs, deployment scripts
│   ├── tier2_boundary/             # Tier 2: Empty inputs, weight boundaries, auth tokens, sanitization
│   ├── tier3_pairwise/             # Tier 3: Draft-to-DOCX pipeline, AI RPC sync, zip inspection
│   └── tier4_workload/             # Tier 4: Full lecturer journey, VPS multi-tenant isolation
└── rps-form-app/                   # Full-Stack Monorepo
    ├── apps/
    │   ├── api/                    # Express backend
    │   │   ├── src/
    │   │   │   ├── config/         # Environment & path resolver
    │   │   │   ├── controllers/    # RpsController, TemplateController, AiController
    │   │   │   ├── middleware/     # agentAuth, errorHandler, requestLogger
    │   │   │   ├── routes/         # rps.routes, template.routes, ai.routes
    │   │   │   ├── services/       # rps, docx, pdf, ai, learning, logger
    │   │   │   ├── validators/     # Zod validation schemas
    │   │   │   └── server.ts       # Express bootstrap & route registration
    │   │   ├── dist/               # Compiled backend JavaScript
    │   │   └── package.json
    │   └── web/                    # React frontend (Vite + Tailwind)
    │       ├── src/
    │       │   ├── components/     # UI components, RPS forms, assessment matrix
    │       │   ├── pages/          # Dashboard, Wizard, Settings, AiPlayground
    │       │   ├── stores/         # Zustand form store
    │       │   ├── services/       # Axios API client
    │       │   └── App.tsx
    │       ├── dist/               # Compiled frontend static assets
    │       └── package.json
    ├── prisma/
    │   ├── schema.prisma           # Prisma schema (RpsDocument, Template, AiAgent, Logs)
    │   ├── dev.db                  # Local SQLite database
    │   └── migrations/             # Database migrations
    ├── storage/                    # Local storage (exports, uploads, logs)
    │   ├── exports/                # Generated DOCX/PDF files
    │   ├── logs/                   # ai-agent.jsonl, ai-errors.jsonl, issue-fix-summary.jsonl
    │   └── uploads/                # User uploaded templates
    ├── templates/                  # Base DOCX templates
    │   └── processed/              # rps-template-processed.docx
    └── package.json
```

---

## 4. Key API Route Catalog & Contracts

### Core Domain Routes (`/api/*`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/rps` | List all RPS documents (returns summary list) | Public |
| `POST` | `/api/rps` | Create new RPS document | Public |
| `GET` | `/api/rps/:id` | Get full RPS document with parsed data | Public |
| `PUT` | `/api/rps/:id` | Update full or partial RPS document | Public |
| `DELETE` | `/api/rps/:id` | Delete RPS document | Public |
| `GET` | `/api/rps/:id/export/docx` | Stream generated DOCX file | Public |
| `GET` | `/api/rps/:id/export/pdf` | Stream converted PDF file (LibreOffice) | Public |
| `GET` | `/api/templates/active` | Get active template metadata | Public |
| `POST` | `/api/templates/upload` | Upload custom DOCX template | Public (sanitized) |

### AI DX & Introspection Routes (`/api/v1/ai/*`)
*All endpoints require header `X-Agent-Key: <token>` or `Authorization: Bearer <token>`.*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/ai/context` | System telemetry, uptime, memory, supported template tags, schema rules |
| `GET` | `/api/v1/ai/context/rps/:id` | Document-level deep inspection, missing fields, weight audit |
| `GET` | `/api/v1/ai/actions/catalog` | JSON schema catalog of executable RPC actions |
| `POST` | `/api/v1/ai/actions/execute` | Unified Action RPC Hub (`{ action, parameters }`) |
| `GET` | `/api/v1/ai/learning/rules` | Active learned rules, error avoidance memory, constraints |
| `POST` | `/api/v1/ai/learning/rules` | Register new learned rule discovered by human/agent |
| `GET` | `/api/v1/ai/learning/summaries` | Retrieve concise historical issue-to-technical-fix logs |
| `POST` | `/api/v1/ai/learning/issue-fix` | Record new issue-to-fix technical summary entry |
| `POST` | `/api/v1/ai/learning/feedback` | Ingest agent or user feedback with optional suggested rules |
| `GET` | `/api/v1/ai/history` | Query recent agent interaction logs from database |
| `GET` | `/api/v1/ai/errors` | Query recent agent error telemetry from database |

---

## 5. Core Domain Concepts & RPS Schemas

### 16-Week Matrix Structure
- Standard Indonesian semester comprises **16 weeks**:
  - Weeks 1–7: Formative learning sessions.
  - **Week 8**: Ujian Tengah Semester (UTS / Midterm Exam).
  - Weeks 9–15: Advanced formative learning sessions.
  - **Week 16**: Ujian Akhir Semester (UAS / Final Exam).

### Assessment Weight Rule
- The sum of all assessment components (`bobotPenilaian`) across all weeks or evaluation components must equal **exactly 100%**.
- Negative weights (`< 0%`) are strictly invalid.
- Weights `!= 100%` produce compliance warnings in `rps.validate` and `rps.audit_compliance`.

### Template Placeholder Tags
The base template (`rps-template-processed.docx`) utilizes docxtemplater tags:
- `{INSTITUSI}`, `{FAKULTAS}`, `{PROGRAM_STUDI}`
- `{NAMA_MATA_KULIAH}`, `{KODE_MATA_KULIAH}`, `{SKS}`, `{SEMESTER}`
- `{DOSEN_PENGEMBANG}`, `{KOORDINATOR_RMK}`, `{KETUA_PRODI}`
- Loops: `{#cplList}...{/cplList}`, `{#cpmkList}...{/cpmkList}`, `{#minggu}...{/minggu}`

---

## 6. Agent Introspection & Action Hub RPC Protocol

### Action Hub Request
```http
POST /api/v1/ai/actions/execute HTTP/1.1
Host: 127.0.0.1:3000
X-Agent-Key: kampus-ai-agent-key-dev
X-Agent-Name: AutoAgent
Content-Type: application/json

{
  "action": "rps.create",
  "parameters": {
    "title": "RPS Kalkulus I",
    "courseName": "Kalkulus I",
    "courseCode": "MAT101",
    "sks": 3,
    "semester": "1"
  }
}
```

### Action Hub Response
```json
{
  "success": true,
  "result": {
    "id": "cm...uuid",
    "title": "RPS Kalkulus I",
    "courseCode": "MAT101",
    "status": "DRAFT"
  },
  "traceId": "trace-1727179000000"
}
```

### Available Actions in Catalog
- `rps.create`: Persist new RPS document.
- `rps.update`: Modify existing document.
- `rps.get`: Fetch document by ID.
- `rps.validate`: Validate assessment weights, week count, and required fields.
- `rps.export_docx`: Generate DOCX file and return file path and byte size.
- `rps.audit_compliance`: Audit document against SN-Dikti and OBE criteria.
- `system.run_doctor`: Execute authentic 3-layer anti-hallucination diagnostic.
- `system.ping`: Diagnostic health ping.
- `learning.get_summaries`: Context compression issue-to-fix history.
- `learning.record_issue_fix`: Register technical fix and rule to memory.

---

## 7. VPS Infrastructure & Deployment Topology

| Property | Value |
|---|---|
| **Host IP** | `38.103.170.236` |
| **SSH User / Port** | `root` / `22` |
| **Target Base Directory** | `/var/www/kampus-dosen` |
| **Releases Directory** | `/var/www/kampus-dosen/releases/<timestamp>/` |
| **Active Symlink** | `/var/www/kampus-dosen/current` |
| **Shared Persistent Assets** | `/var/www/kampus-dosen/shared/` (`database.sqlite`, `storage/`) |
| **Internal API Port** | `3005` (Bound to `127.0.0.1:3005`) |
| **Systemd Service** | `/etc/systemd/system/kampus-api.service` |
| **Domain** | `kampus.rumahku.web.id` |
| **Web Server** | Apache 2.4 (`/etc/apache2/sites-available/kampus.conf`) |
| **DocumentRoot** | `/var/www/kampus-dosen/current/apps/web/dist` |
| **Reverse Proxy** | `ProxyPass /api http://127.0.0.1:3005/api` |

### Multi-Tenant Isolation Safeguards
The VPS hosts multiple production sites. Strict isolation rules:
1. Never edit `/etc/apache2/sites-available/syukran.conf`, `arabiq.conf`, or `uncm.conf`.
2. Never touch `/var/www/syukran-laravel`, `/var/www/arabiq`, or `/var/www/uncm`.
3. Keep all files, logs, and databases inside `/var/www/kampus-dosen`.
4. Run Node.js on dedicated port `3005` (different from other tenants' ports).

---

## 8. Quick Reference Index (Anti-"Lost-in-the-Middle")

| Objective | Command |
|---|---|
| **Run All Tests** | `node tests/runner.js` |
| **Run Tier 1 Only** | `node tests/runner.js --tier 1` |
| **Run Tier 2 Only** | `node tests/runner.js --tier 2` |
| **Run Tier 3 Only** | `node tests/runner.js --tier 3` |
| **Run Tier 4 Only** | `node tests/runner.js --tier 4` |
| **Run Single Test** | `node tests/runner.js --file tests/tier1_feature/test_rps_crud.js` |
| **Compile API** | `npm --prefix rps-form-app/apps/api run build` |
| **Compile Web** | `npm --prefix rps-form-app/apps/web run build` |
| **Deploy via PowerShell** | `.\deploy.ps1 -Host "38.103.170.236" -User "root"` |
| **Deploy via Bash** | `./deploy.sh 38.103.170.236 root` |
| **1-Click HTTP Fix** | Open `http://38.103.170.236/fix_server.php` or `http://kampus.rumahku.web.id/fix_server.php` |
| **Check AI Telemetry** | View `rps-form-app/storage/logs/ai-agent.jsonl` |
| **Check Issue-Fix Log** | View `rps-form-app/storage/logs/ISSUE_FIX_SUMMARY.md` |
| **View API Context** | `curl -H "X-Agent-Key: kampus-ai-agent-key-dev" http://127.0.0.1:3000/api/v1/ai/context` |
| **View Learning Summary**| `curl -H "X-Agent-Key: kampus-ai-agent-key-dev" http://127.0.0.1:3000/api/v1/ai/learning/summaries` |
