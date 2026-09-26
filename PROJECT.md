# Project: Dunia_Kampus (Aplikasi Dosen - RPS)

## Architecture
- **Monorepo Structure**: `c:\xampp\htdocs\Aplikasi_Dosen\rps-form-app`
  - `apps/web`: React 18, Vite, Tailwind CSS, TypeScript, Lucide React icons, responsive lecturer UI.
  - `apps/api`: Express.js, TypeScript, Prisma ORM, Pizzip + Docxtemplater for DOCX generation, LibreOffice headless for PDF conversion.
  - `storage/`: Persistent document templates, generated exports, and AI JSONL log files.
- **Data Layer**:
  - SQLite database: Local `rps-form-app/prisma/dev.db`, VPS `/var/www/kampus-dosen/shared/database.sqlite`.
  - Models: `User`, `RpsDocument`, `Template`, and AI ecosystem models (`AiAgent`, `AiInteractionLog`, `AiErrorLog`, `AiFeedback`, `AiLearnedRule`).
- **Target Deployment**:
  - VPS: `38.103.170.236` (Ubuntu 24.04 LTS, Apache 2.4, Node.js v20).
  - Domain: `kampus.rumahku.web.id`.
  - Directory: `/var/www/kampus-dosen/` (strictly isolated from existing `syukran-laravel`, `arabiq`, `uncm`).
  - Web Server: Apache VirtualHost `kampus.conf` serving static frontend and reverse proxying `/api` to Node.js port `3005`.
  - Service: `kampus-api.service` managed via systemd.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | TypeScript Clean Build | Fix all TS errors (`TS6133`, `TS7006`, `TS7031`), unused symbols, and duplicate cases in `apps/web` | M1 | survey_1 |
| 2 | Backend MVC Modularization | Deconstruct monolithic `server.ts` into `routes/`, `controllers/`, `services/`, `validators/` | M1 | survey_1 |
| 3 | Command Injection Elimination | Replace `child_process.exec()` with safe parameter handling / `spawn` in PDF conversion | M1 | survey_1 |
| 4 | Secure Template Management | Authenticate/validate template upload endpoint and prevent arbitrary overwrite of production DOCX | M1 | survey_1 |
| 5 | Environment-Aware API Client | Replace hardcoded `localhost:3000` with relative `/api` and configurable base URL | M1 | survey_1 |
| 6 | Reactive Form State & Auto-Save | Replace uncontrolled `defaultValue` and mock JSON submission with full reactive form state & draft saving | M1 | survey_1 |
| 7 | Full RPS Data Model & Export | Support comprehensive RPS fields (metadata, CPL, CPMK, 16-week matrix, evaluation weights) in state & export | M1 | survey_1 |
| 8 | UI/UX Usability Fixes | Eliminate duplicate sidebars on `/settings`, wire responsive mobile drawer, improve feedback alerts | M1 | survey_1 |
| 9 | AI Agent Scaffolding & Routing | Implement `/api/v1/ai/*` router with `X-Agent-Key` authentication and introspection endpoints | M2 | survey_2 |
| 10 | AI Context Introspection | `GET /api/v1/ai/context` exposing active template tags, system capabilities, and schema rules | M2 | survey_2 |
| 11 | AI Tool & Action RPC Hub | `GET /actions/catalog` and `POST /actions/execute` compatible with external AI agent tool calling | M2 | survey_2 |
| 12 | Persistent AI Logging Schema | Prisma models (`AiAgent`, `AiInteractionLog`, `AiErrorLog`, `AiFeedback`, `AiLearnedRule`) & migrations | M2 | survey_2 |
| 13 | Dual-Layer Telemetry & Memory | Append-only JSONL files (`storage/logs/ai-agent.jsonl`, `ai-errors.jsonl`) + DB queryable history | M2 | survey_2 |
| 14 | Anti-Hallucination 3-Layer Check | Diagnostic endpoint / tool verifying physical SQLite DB, API JSON response, and frontend schema | M2 | survey_2 |
| 15 | Continuous Learning Rule Seeding | Seed initial learned rules into memory (TS strict patterns, Word XML layout, RPS weight constraints) | M2 | survey_2 |
| 16 | SOP Compliant Packaging | Local build packaging script generating `web_build.zip` (strictly zero `scp -r`) | M3 | survey_3 |
| 17 | Direct SSH Deployment Script | PowerShell (`deploy.ps1`) and Bash (`deploy.sh`) scripts deploying to `38.103.170.236` via SSH | M3 | survey_3 |
| 18 | Multi-Tenant Isolated Apache Vhost | Apache configuration (`kampus.conf`) for `kampus.rumahku.web.id` proxying port 3005 without conflicts | M3 | survey_3 |
| 19 | Systemd Daemon Management | `kampus-api.service` configuration to manage background Node.js process reliably | M3 | survey_3 |
| 20 | Fallback HTTP Self-Fixing Script | Standalone `fix_server.php` script for 1-click self-extracting deployment/repair | M3 | survey_3 |
| 21 | VPS Environment & LibreOffice Setup | Swap file setup (1GB) and `libreoffice-writer` installation for reliable headless PDF export | M3 | survey_3 |
| 22 | Online Live Site Verification | Verification script validating live web UI and API responses at `kampus.rumahku.web.id` / IP | M3 | survey_3 |
| 23 | Comprehensive E2E Testing Suite | Opaque-box requirement-driven test suite covering all tiers (Tiers 1-4) | E2E Track | survey_all |
| 24 | Adversarial Hardening & Final Gate | White-box adversarial testing (Tier 5) and audit dossier preparation for Sentinel | M4 | survey_all |
| 25 | Context Compression & Issue-to-Fix Logging | Concise summary mechanism for issue-to-technical fix, persistent JSONL & Markdown logs, endpoints `/api/v1/ai/learning/summaries` & `POST /api/v1/ai/learning/issue-fix` | M2 | survey_2 |
| 26 | `agents.md` Central Command Index | Comprehensive central command index at project root documenting golden rules, architecture, directory map, contracts, schemas, RPC hub, and VPS deployment topology | M3 | survey_3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Independent requirement-driven opaque-box test suite (Tiers 1-4) | none | DONE |
| M1 | Architecture, Security & UI/UX Refactoring | Features 1-8: TypeScript build fix, backend MVC modularization, security sanitization, reactive form wiring, UI usability fixes | none | DONE |
| M2 | AI DX & Continuous Learning Ecosystem | Features 9-15, 25: `/api/v1/ai/*` scaffolding, context introspection, action RPC hub, Prisma AI models, JSONL logging, 3-layer verification, learned rules, context compression issue-to-fix logging | M1 contracts | DONE |
| M3 | VPS Direct Deployment & Isolation | Features 16-22, 26: `web_build.zip` packaging, SSH upload & extraction, Apache `kampus.conf` vhost, systemd service, `fix_server.php` fallback, online verification, `agents.md` Central Command Index | M1, M2 | DONE |
| M4 | Final E2E Integration & Acceptance | Features 23-24: 100% E2E test pass (Tiers 1-4), Tier 5 adversarial coverage hardening, final victory audit readiness | M1, M2, M3, E2E | PLANNED |

## Interface Contracts

### 1. Frontend ↔ Backend API (`apps/web` ↔ `apps/api`)
- Base URL: Configurable via `VITE_API_URL` environment variable, defaulting to `/api` (same-origin reverse proxy).
- Core Endpoints:
  - `GET /api/rps`: List all RPS documents (returns `Array<RpsSummary>`).
  - `POST /api/rps`: Create new RPS document (payload: `RpsCreateInput`, returns `RpsDocument`).
  - `GET /api/rps/:id`: Get full RPS document details.
  - `PUT /api/rps/:id`: Update existing RPS document.
  - `GET /api/rps/:id/export/docx`: Stream generated DOCX file.
  - `GET /api/rps/:id/export/pdf`: Stream converted PDF file.
  - `POST /api/templates/upload`: Authenticated/validated upload of custom DOCX template.
- Error Format: JSON `{ "success": false, "error": { "code": string, "message": string, "details"?: any } }`.

### 2. External AI Agents ↔ AI DX Scaffolding (`/api/v1/ai/*`)
- Authentication: Header `X-Agent-Key: <token>` (validated against configured agent keys in `.env`).
- Endpoints:
  - `GET /api/v1/ai/context`: Returns `{ system: { node, uptime, memory, storage }, template: { activeTemplate, supportedTags, schemaVersion }, activeRules: Array<LearnedRule> }`.
  - `GET /api/v1/ai/actions/catalog`: Returns JSON schemas of all executable actions (`rps.create`, `rps.update`, `rps.validate`, `system.run_doctor`, etc.).
  - `POST /api/v1/ai/actions/execute`: Body `{ "action": string, "parameters": object }` -> Returns `{ "success": boolean, "result": any, "traceId": string }`.
  - `GET /api/v1/ai/learning/rules`: Returns list of learned rules, error patterns, and recommended constraints.
  - `POST /api/v1/ai/learning/feedback`: Body `{ "interactionId"?: string, "agentName": string, "feedbackType": string, "content": string, "suggestedRule"?: string }`.
- Telemetry:
  - Every agent request logged to `AiInteractionLog` table and appended to `storage/logs/ai-agent.jsonl`.
  - Every error logged to `AiErrorLog` table and appended to `storage/logs/ai-errors.jsonl`.

### 3. Deployment Pipeline ↔ VPS Environment (`deploy.ps1` / `deploy.sh` ↔ `38.103.170.236`)
- Host: `38.103.170.236`, User: `root`, Port: `22`.
- Target Base Directory: `/var/www/kampus-dosen`.
- Subdirectories:
  - `/var/www/kampus-dosen/releases/<timestamp>/`: Extracted artifact.
  - `/var/www/kampus-dosen/current`: Symlink pointing to the active release.
  - `/var/www/kampus-dosen/shared/`: Shared persistent assets (`database.sqlite`, `storage/exports/`, `storage/logs/`, `storage/templates/`).
- Web Server Config: `/etc/apache2/sites-available/kampus.conf`.
  - `ServerName kampus.rumahku.web.id`.
  - `DocumentRoot /var/www/kampus-dosen/current/apps/web/dist`.
  - Reverse proxy: `ProxyPass /api http://127.0.0.1:3005/api` and `ProxyPassReverse /api http://127.0.0.1:3005/api`.
- Daemon: `/etc/systemd/system/kampus-api.service`.
  - Runs `node apps/api/dist/server.js` with `PORT=3005` and `DATABASE_URL="file:/var/www/kampus-dosen/shared/database.sqlite"`.

## Code Layout
```
c:\xampp\htdocs\Aplikasi_Dosen\
├── .agents/                        # Agent metadata & coordination files
│   ├── orchestrator_1/             # Root Project Orchestrator
│   ├── e2e_orch_1/                 # E2E Testing Orchestrator
│   ├── sub_orch_m1_1/              # Sub-orchestrator M1 (Architecture & UX)
│   ├── sub_orch_m2_1/              # Sub-orchestrator M2 (AI DX Ecosystem)
│   └── sub_orch_m3_1/              # Sub-orchestrator M3 (VPS Deployment)
├── PROJECT.md                      # Global index, architecture, milestones, contracts
├── ORIGINAL_REQUEST.md             # Immutable user requirements
├── deploy.ps1                      # Windows PowerShell automated deployment script
├── deploy.sh                       # Linux / WSL automated deployment script
├── fix_server.php                  # Self-extracting / fixing HTTP recovery script
├── tests/                          # E2E requirement-driven test suite (Tiers 1-4)
│   ├── runner.js                   # Unified test runner
│   ├── tier1_feature/              # Tier 1 tests
│   ├── tier2_boundary/             # Tier 2 tests
│   ├── tier3_pairwise/             # Tier 3 tests
│   └── tier4_workload/             # Tier 4 tests
└── rps-form-app/                   # Application monorepo
    ├── apps/
    │   ├── api/                    # Express backend
    │   │   ├── src/
    │   │   │   ├── controllers/    # Request controllers
    │   │   │   ├── routes/         # Modular route definitions
    │   │   │   ├── services/       # Business logic (RPS, DOCX, PDF, AI, Diagnostics)
    │   │   │   ├── validators/     # Input validation schemas (Zod)
    │   │   │   ├── middleware/     # Agent auth, error handling, CORS
    │   │   │   └── server.ts       # Application entry point
    │   │   └── package.json
    │   └── web/                    # React frontend
    │       ├── src/
    │       │   ├── components/     # UI components (Navbar, Sidebar, Layout, Modal)
    │       │   ├── pages/          # Pages (Dashboard, Wizard, Settings)
    │       │   ├── stores/         # State management (RPS form store)
    │       │   ├── services/       # API client service
    │       │   ├── types/          # Shared TypeScript interfaces
    │       │   └── App.tsx         # Main router and layout
    │       └── package.json
    ├── prisma/
    │   ├── schema.prisma           # Prisma schema (RPS + AI models)
    │   └── dev.db                  # Local SQLite database
    ├── storage/                    # Persistent storage (templates, exports, logs)
    └── package.json
```
