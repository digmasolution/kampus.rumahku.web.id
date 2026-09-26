# AI Developer Experience & Ecosystem (R2) — Comprehensive Survey & Architecture Specification

**Project**: Dunia_Kampus (Module: Dosen / RPS Builder)  
**Target Domain**: `kampus.rumahku.web.id`  
**Author**: Explorer Survey 2 (AI DX & Ecosystem Requirements)  
**Date**: 2026-09-24  
**Status**: Completed Survey & Architecture Design

---

## 1. Executive Summary & Context

The authoritative objective (R2) defined in `ORIGINAL_REQUEST.md` mandates the implementation of systems that facilitate a seamless workflow between human developers, university lecturers (*Dosen*), and cross-platform AI agents. This includes:
1. **Cross-Platform AI Agent Communication Scaffolding**: Standardized integration points allowing autonomous and assistant AI agents (across Antigravity, Cursor, Claude Code, OpenAI API, CLI tools, and external platforms) to inspect system context, perform safe operations, and retrieve real-time application state.
2. **Persistent Logging & Continuous Learning Mechanism**: A verifiable dual-layer storage system (Prisma SQLite database + structured JSONL logs) enabling AI agents to track mistakes, log tool execution failures, capture human feedback and corrections, and accumulate a persistent knowledge base of *learned rules* to prevent repeating errors over time.

### Context Alignment:
- **Application Name**: `Dunia_Kampus`
- **User Role**: `Dosen` (Lecturer)
- **Primary Feature**: `RPS` (*Rencana Pembelajaran Semester* / Semester Learning Plan)
- **Target Deployment Domain**: `kampus.rumahku.web.id` (Host VPS: `38.103.170.236`)
- **Tech Stack**: Monorepo (`apps/api`: Node.js / Express / TypeScript / Prisma / SQLite / Docxtemplater; `apps/web`: React 18 / Vite / Tailwind CSS / Zustand / React Hook Form / Zod).

---

## 2. Current State Audit (Existing Telemetry, Logging & Error Facilities)

A systematic investigation was conducted across the entire repository (`c:\xampp\htdocs\Aplikasi_Dosen`). The direct observations and shortcomings are categorized below:

### 2.1 Backend Error Handling & Logging (`apps/api`)
- **Primitive Console Logging**: The backend relies solely on rudimentary `console.log("API running on port " + port)` and three `console.error` calls located inside `server.ts` (lines 102, 107, 132).
- **Absence of Structured Logging**: There is no logging framework (e.g., `pino`, `winston`, or `morgan`). Logs lack ISO-8601 timestamps, log severity levels (`DEBUG`, `INFO`, `WARN`, `ERROR`), request IDs (`traceId`), and machine-readable JSON formatting.
- **No Persistent File Logging**: No log directory (`storage/logs/`) exists in the active flow; all logs are emitted only to `stdout`/`stderr` and lost upon server restart or process crashes.
- **Inconsistent Error Response Structure**:
  - `server.ts:39`: `res.status(404).json({ error: "Not found" })`
  - `server.ts:66`: `res.status(500).json({ error: "Template not found" })`
  - `server.ts:108`: `res.status(500).json({ error: "Multi error", details: errorMessages })`
  - `server.ts:133`: `res.status(500).json({ error: "Failed to convert to PDF. Ensure LibreOffice is installed and in PATH." })`
  There is no standard RFC 7807 (Problem Details) format or standardized error codes.
- **Missing Global Exception Handlers**: There are no listeners for `process.on('uncaughtException')` or `process.on('unhandledRejection')`. An unhandled promise rejection can crash the server process on modern Node.js versions.

### 2.2 Frontend Telemetry & Error Handling (`apps/web`)
- **Synchronous Browser Alerts**: When API or network requests fail in `WizardMockup.tsx` and `TemplateSettingsMockup.tsx`, errors are handled using blocking `alert("Pastikan server backend (npm run dev) sudah menyala.")` and `alert("Error: " + err.error)`.
- **No Error Boundary**: `apps/web` does not implement a React Error Boundary; any rendering exception causes a white screen of death.
- **No Telemetry / Diagnostic Reporting**: Frontend errors, network request timings, and validation failures are not reported back to any API endpoint for observability.
- **TypeScript Strict Mode Build Breakage**:
  Running `npm run build -w apps/web` currently fails with 9 TypeScript errors (`TS6133: unused variable`, `TS7006: implicit any`) due to strict options in `apps/web/tsconfig.json` (`noUnusedLocals: true`, `noUnusedParameters: true`).

### 2.3 Diagnostic Tooling (`scripts/doctor.js`)
- A single diagnostic script `rps-form-app/scripts/doctor.js` exists.
- It tests: Node.js version, NPM, LibreOffice availability, SQLite `dev.db` existence, storage directories (`storage/uploads`, `storage/exports`, `storage/drafts`), template directories, and port 3000 availability.
- **Limitation**: It is exclusively a CLI script and is not exposed via an API endpoint or accessible by external AI agents or remote monitoring tools.

### 2.4 AI Integration Status
- **Current State**: 0% implemented.
- No endpoints exist under `/api/ai/*` or `/api/agent/*`.
- No database tables exist to track AI interactions, errors, feedback, or learned memory.
- No machine-readable action catalog or context reflection exists for AI agents.

---

## 3. Cross-Platform AI Agent Communication Scaffolding

To allow AI agents across heterogeneous environments (Gemini Antigravity, Cursor IDE, Claude Code, GitHub Actions, custom CLI, or HTTP webhooks) to safely operate on `Dunia_Kampus`, we establish a standardized **AI DX Communication Bus**.

### 3.1 Architectural Principles
1. **Zero-Friction Authentication**: Agents authenticate via standard HTTP header `X-Agent-Key` or `Authorization: Bearer <token>`.
2. **Platform & Agent Attribution**: Every request requires agent identification headers:
   - `X-Agent-Id`: Unique agent conversation or instance identifier.
   - `X-Agent-Name`: e.g., `Antigravity-Agent`, `Cursor-Dosen-Assistant`.
   - `X-Agent-Platform`: e.g., `antigravity`, `cursor`, `copilot`, `cli`, `web`.
3. **Deterministic JSON Contracts**: All endpoints adhere strictly to JSON schemas, ensuring agents never need to parse unformatted HTML or arbitrary strings.
4. **Read/Write Safety & Sandboxing**: Dangerous actions (e.g., template overwrites, batch deletions) require elevated role privileges (`AGENT_ADMIN`).

```
+---------------------------------------------------------------------------------+
|                               AI AGENT CLIENTS                                  |
|   (Antigravity / Gemini, Cursor IDE, Claude Code, Open-WebUI, CLI Scripts)     |
+---------------------------------------------------------------------------------+
                                      |
                     HTTP / JSON with X-Agent-Key
                                      v
+---------------------------------------------------------------------------------+
|                       AI DX COMMUNICATION MIDDLEWARE                            |
|  - Agent Auth & Role Verification (AGENT_READONLY / CONTRIBUTOR / ADMIN)        |
|  - Distributed Trace ID Injection (`traceId`)                                  |
|  - Auto-Logging Middleware (Dual Pipe: SQLite DB + `storage/logs/ai-agent.jsonl`)|
+---------------------------------------------------------------------------------+
         |                                 |                                 |
         v                                 v                                 v
+------------------+             +-------------------+             +------------------+
| Context Engine   |             | Action RPC Router |             | Continuous Learn |
| /api/v1/ai/      |             | /api/v1/ai/       |             | /api/v1/ai/      |
| context/*        |             | actions/*         |             | learning/*       |
| - Introspection  |             | - Catalog (Tools) |             | - Error Registry |
| - RPS Deep State |             | - Execution Hub   |             | - Feedback Loop  |
| - Template Dfns  |             | - Compliance Audit|             | - Learned Rules  |
+------------------+             +-------------------+             +------------------+
         |                                 |                                 |
         +---------------------------------+---------------------------------+
                                           v
+---------------------------------------------------------------------------------+
|                                 CORE SYSTEM                                     |
|  - Prisma ORM (SQLite `dev.db`)                                                 |
|  - Docxtemplater & PizZip Generator                                             |
|  - LibreOffice Headless PDF Converter                                           |
|  - Storage Engine (`storage/exports`, `storage/templates`, `storage/logs`)       |
+---------------------------------------------------------------------------------+
```

---

## 4. Context Introspection Engine

AI agents frequently hallucinate when they lack authoritative ground-truth context about the application's runtime capabilities, data schemas, active templates, and business rules. The Context Introspection Engine provides real-time system reflection.

### 4.1 System Introspection Endpoint: `GET /api/v1/ai/context`
Returns the complete environmental snapshot:
- **Application Profile**: Name (`Dunia_Kampus`), active role context (`Dosen`), module (`RPS`), version (`1.0.0`), host domain (`kampus.rumahku.web.id`).
- **Runtime Health**: Database connection status, record counts, storage directory permissions, LibreOffice availability for PDF rendering.
- **RPS Domain Schema**: Complete structural specification of an RPS document (Identity, Otorisasi, CPL, CPMK, Sub-CPMK, Matriks Korelasi, 16-Week Weekly Plan, Assessment Criteria, References).
- **Active Template Reflection**: List of placeholders discovered in the currently active docx template (e.g. `{{INSTITUSI}}`, `{{PROGRAM_STUDI}}`, `{{NAMA_MATA_KULIAH}}`, `{{KODE_MATA_KULIAH}}`, etc.) and warnings regarding unsupported tags or formatting caveats.
- **Available Actions**: Summary of callable actions.

### 4.2 Document Introspection Endpoint: `GET /api/v1/ai/context/rps/:id`
Provides deep diagnostics on an existing RPS document:
- Raw data fields unpacked from `dataJson`.
- Structural completeness score (0-100%).
- Missing mandatory fields list (e.g., `['dosenPengembang', 'tanggal', 'weeklyPlan[7].bobot']`).
- Pedagogical validation warnings (e.g. "Weekly plan total weight is 80%, expected 100%").
- Export readiness flag (DOCX ready: `true`/`false`, PDF ready: `true`/`false`).

---

## 5. Structured Action Execution System (Tool Calling RPC)

External AI agents need a predictable mechanism to invoke operations. Rather than forcing agents to orchestrate fragmented CRUD routes, the AI DX provides a unified **Action Execution RPC** compatible with OpenAI Function Calling, Anthropic Tool Use, and Gemini Function Declarations.

### 5.1 Tool Catalog: `GET /api/v1/ai/actions/catalog`
Returns a machine-readable OpenAPI / JSON Schema definition of all available tools.

### 5.2 Action Hub: `POST /api/v1/ai/actions/execute`
Single RPC entrypoint:
```json
{
  "action": "rps.audit_compliance",
  "parameters": {
    "documentId": "d2097dcd-9945-4adc-aa9d-302901f27733"
  }
}
```

### 5.3 Core Standard Actions for RPS & Dosen

| Action Name | Description | Key Parameters | Return Value |
|---|---|---|---|
| `rps.introspect` | Deep inspect document structure and completion | `documentId` | Detailed diagnostic object |
| `rps.create_draft` | Initialize new RPS with boilerplate structure | `courseName`, `courseCode`, `sks` | Created `RpsDocument` |
| `rps.update_section` | Granular update to a section (CPMK, Weekly, etc.) without wiping other data | `documentId`, `section`, `data` | Updated `RpsDocument` |
| `rps.audit_compliance` | Validate against SN-Dikti / OBE rules (16 weeks, 100% weight, UTS week 8, UAS week 16) | `documentId` | Pass/Fail + Issues list |
| `rps.generate_cpmk` | AI helper to suggest CPMK & Sub-CPMK for course description | `courseName`, `cplList`, `topic` | Suggested CPMK array |
| `template.validate` | Check DOCX template for valid tags and XML safety | `templatePath` or `fileId` | Tag list + Syntax errors |
| `template.repair_xml` | Clean corrupted split XML tags (`{{` and `}}`) | `templatePath` | Repaired template path |
| `export.generate` | Trigger DOCX or PDF generation with direct artifact URL | `documentId`, `format` (`docx`\|`pdf`) | Download URL, file size, status |
| `system.run_doctor` | Run full diagnostic suite programmatically | None | Doctor check results |

---

## 6. Persistent Logging, Mistake Tracking & Feedback Loop (Continuous Learning)

A key acceptance criterion in `ORIGINAL_REQUEST.md` is:
> *"A verifiable mechanism (e.g., specific log files, feedback database tables, or memory modules) exists to store and retrieve AI interaction history and error logs."*

### 6.1 The Continuous Learning Cycle
```
   [AI Agent / Dev Action]
             |
             v
   [Execution & Result] ────(Success)───> Logged to `AiInteractionLog`
             |
          (Error)
             v
   [Log to `AiErrorLog` & `storage/logs/ai-errors.jsonl`]
             |
             v
   [Root Cause Analysis & Fix Formulation]
             |
             v
   [Persist to `AiLearnedRule` (Memory Module)]
             |
             v
   [Subsequent Agent Context Ingestion]
   Agents query `GET /api/v1/ai/learning/rules` before execution
   ──> Mistake Avoided! (Continuous Improvement Verified)
```

### 6.2 Verifiable Logging Layers
1. **Relational Database Layer (Prisma SQLite)**:
   - Queryable via SQL/Prisma for structured joins, historical reporting, and analytical queries.
   - Tables: `AiAgent`, `AiInteractionLog`, `AiErrorLog`, `AiFeedback`, `AiLearnedRule`.
2. **Physical Append-Only JSON Lines Logs**:
   - `storage/logs/ai-agent.jsonl`: Stream of all agent API requests, inputs, outputs, latencies, and statuses.
   - `storage/logs/ai-errors.jsonl`: Stream of all operational errors, Docxtemplater failures, and unhandled exceptions.
   - Guarantees immediate verification via filesystem tools (`cat`, `tail`, `grep`) even if database is locked or undergoing migration.

---

## 7. Database Architecture & Prisma Schema Specifications

The following schema extensions are designed for `rps-form-app/prisma/schema.prisma` to fully support R2 without disrupting existing tables (`User`, `RpsDocument`, `Template`).

```prisma
// ==========================================
// R2: AI DEVELOPER EXPERIENCE & ECOSYSTEM
// ==========================================

model AiAgent {
  id           String         @id @default(uuid())
  name         String         // e.g. "Gemini-Explorer-2", "Cursor-Dosen-Assistant"
  platform     String         // e.g. "antigravity", "cursor", "cli", "open-webui"
  apiKeyHash   String         @unique
  role         String         @default("AGENT_CONTRIBUTOR") // AGENT_READONLY, AGENT_CONTRIBUTOR, AGENT_ADMIN
  isActive     Boolean        @default(true)
  metadata     String?        // JSON: capabilities, model version, system prompt hash
  lastActiveAt DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  interactions AiInteractionLog[]
  errorLogs    AiErrorLog[]
  feedbacks    AiFeedback[]
  learnedRules AiLearnedRule[]
}

model AiInteractionLog {
  id              String       @id @default(uuid())
  agentId         String?
  agent           AiAgent?     @relation(fields: [agentId], references: [id], onDelete: SetNull)
  rpsDocumentId   String?
  rpsDocument     RpsDocument? @relation(fields: [rpsDocumentId], references: [id], onDelete: SetNull)
  traceId         String       @default(uuid()) // Correlation ID for tracing
  action          String       // e.g. "context_introspection", "rps.update_section", "export_docx"
  promptContext   String?      // Context provided to the agent
  requestPayload  String?      // Input arguments (JSON string)
  responsePayload String?      // Output generated (JSON string)
  tokensUsed      Int?         @default(0)
  executionMs     Int          // Execution duration in milliseconds
  status          String       // "SUCCESS", "FAILED", "PARTIAL", "REJECTED"
  errorMessage    String?
  createdAt       DateTime     @default(now())

  errorLogs       AiErrorLog[]
  feedbacks       AiFeedback[]

  @@index([action])
  @@index([status])
  @@index([createdAt])
}

model AiErrorLog {
  id               String            @id @default(uuid())
  interactionId    String?
  interaction      AiInteractionLog? @relation(fields: [interactionId], references: [id], onDelete: SetNull)
  agentId          String?
  agent            AiAgent?          @relation(fields: [agentId], references: [id], onDelete: SetNull)
  errorType        String            // "DOCX_TEMPLATE_ERROR", "VALIDATION_MISMATCH", "DB_QUERY_FAILURE", "LIBREOFFICE_TIMEOUT"
  severity         String            @default("ERROR") // "WARNING", "ERROR", "CRITICAL"
  message          String            // Error summary
  stackTrace       String?           // Complete error stack trace
  contextData      String?           // JSON of payload/parameters that caused the error
  reproductionStep String?           // Steps to reproduce
  attemptedFix     String?           // Fix proposed or attempted by AI
  resolved         Boolean           @default(false)
  resolvedBy       String?           // "HUMAN", "AI_AGENT", "AUTO_REPAIR", "PENDING"
  resolvedAt       DateTime?
  resolutionNotes  String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  @@index([errorType])
  @@index([resolved])
}

model AiFeedback {
  id               String            @id @default(uuid())
  interactionId    String?
  interaction      AiInteractionLog? @relation(fields: [interactionId], references: [id], onDelete: SetNull)
  agentId          String?
  agent            AiAgent?          @relation(fields: [agentId], references: [id], onDelete: SetNull)
  rpsDocumentId    String?
  userId           String?           // Lecturer ID if human feedback
  rating           Int               // 1 to 5 (or -1/1 for thumbs down/up)
  feedbackCategory String            // "CONTENT_QUALITY", "TAXONOMY_ACCURACY", "DOCX_FORMATTING", "CODE_BUG"
  userCorrection   String?           // Human lecturer corrected value
  aiOutputOriginal String?           // Original AI suggestion
  comments         String?           // Qualitative remarks
  createdAt        DateTime          @default(now())
}

model AiLearnedRule {
  id                   String    @id @default(uuid())
  agentId              String?
  agent                AiAgent?  @relation(fields: [agentId], references: [id], onDelete: SetNull)
  category             String    // "DOCX_EXPORT", "RPS_PEDAGOGY", "DATABASE_INTEGRITY", "ERROR_AVOIDANCE"
  ruleCode             String    @unique // e.g. "RULE_DOCX_NO_VERTICAL_MERGE_LOOP"
  title                String    // Descriptive rule title
  description          String    // Detailed explanation of mistake & rationale
  triggerCondition     String    // When to apply (e.g. "When generating 16-week matrix")
  recommendedFix       String    // Concrete avoidance/fix pattern
  confidenceScore      Float     @default(1.0) // 0.0 to 1.0 based on validation count
  occurrencesPrevented Int       @default(0)
  sourceErrorId        String?   // Reference to originating AiErrorLog
  isActive             Boolean   @default(true)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  @@index([category])
  @@index([isActive])
}
```

---

## 8. API Interface Contracts & Specification

All AI DX endpoints are mounted under `/api/v1/ai`.

### 8.1 Authentication & Security Headers

| Header | Description | Mandatory | Example |
|---|---|---|---|
| `X-Agent-Key` | API Key identifying the agent or developer | Yes (or `Bearer`) | `ak_live_dosen_ai_8f3a9` |
| `X-Agent-Id` | Unique session or instance ID | Yes | `agent-antigravity-01` |
| `X-Agent-Platform` | Calling agent environment | Yes | `antigravity` / `cursor` / `cli` |
| `X-Correlation-Id` | Distributed request trace ID | Optional | `trace-89b-44c-112` |

### 8.2 Endpoints Table

| Method | Endpoint | Description | Scopes Required |
|---|---|---|---|
| `GET` | `/api/v1/ai/context` | System introspection & capabilities | `agent:read` |
| `GET` | `/api/v1/ai/context/rps/:id` | Deep RPS state & validation report | `agent:read` |
| `GET` | `/api/v1/ai/actions/catalog` | Machine-readable tool catalog | `agent:read` |
| `POST` | `/api/v1/ai/actions/execute` | Execute structured action / tool | `agent:write` |
| `GET` | `/api/v1/ai/history` | Query interaction history audit trail | `agent:read` |
| `POST` | `/api/v1/ai/history` | Manually record an external AI interaction | `agent:write` |
| `GET` | `/api/v1/ai/errors` | Query error registry & past failures | `agent:read` |
| `POST` | `/api/v1/ai/errors` | Log a runtime error or AI mistake | `agent:write` |
| `PATCH` | `/api/v1/ai/errors/:id/resolve` | Mark error as resolved with resolution notes | `agent:write` |
| `GET` | `/api/v1/ai/feedback` | Retrieve human/agent feedback data | `agent:read` |
| `POST` | `/api/v1/ai/feedback` | Submit feedback/correction on AI output | `agent:write` |
| `GET` | `/api/v1/ai/learning/rules` | Retrieve active learned rules (memory module) | `agent:read` |
| `POST` | `/api/v1/ai/learning/rules` | Register newly discovered rule / anti-pattern | `agent:write` |

### 8.3 Sample Request & Response Schemas

#### A. Context Introspection Response (`GET /api/v1/ai/context`)
```json
{
  "system": {
    "application": "Dunia_Kampus",
    "module": "Dosen / RPS Builder",
    "version": "1.0.0",
    "domain": "kampus.rumahku.web.id",
    "environment": "development",
    "timestamp": "2026-09-24T14:45:00.000Z"
  },
  "health": {
    "database": "CONNECTED",
    "libreoffice": "NOT_DETECTED_PDF_DISABLED",
    "storage": "READ_WRITE_OK",
    "activeTemplatesCount": 1,
    "totalRpsDocuments": 4
  },
  "rpsSchema": {
    "sections": [
      "identitas",
      "pengesahan",
      "capaianPembelajaran",
      "bahanKajian",
      "metodePembelajaran",
      "rencanaMingguan",
      "penilaian",
      "referensi"
    ],
    "weeklyPlanRequirements": {
      "totalWeeks": 16,
      "midtermExamWeek": 8,
      "finalExamWeek": 16,
      "requiredTotalWeight": 100
    }
  },
  "template": {
    "name": "rps-template-processed.docx",
    "version": "1.0",
    "supportedPlaceholders": [
      "INSTITUSI",
      "PROGRAM_STUDI",
      "NAMA_MATA_KULIAH",
      "KODE_MATA_KULIAH",
      "SKS",
      "SKS_T",
      "SKS_P",
      "TANGGAL_PENYUSUNAN",
      "DOSEN_PENGEMBANG",
      "KOORDINATOR_MATA_KULIAH"
    ]
  },
  "learnedRulesCount": 3
}
```

#### B. Learned Rules Response (`GET /api/v1/ai/learning/rules`)
```json
{
  "total": 3,
  "rules": [
    {
      "ruleCode": "RULE_DOCX_NO_VERTICAL_MERGE_LOOP",
      "category": "DOCX_EXPORT",
      "title": "Avoid paragraph loops across vertically merged cells in Word",
      "description": "Docxtemplater paragraph loops inside table rows with vertical XML cell merges (<w:vMerge>) corrupt DOCX layout. Keep weekly table rows structurally isolated from merged identity headers.",
      "triggerCondition": "export.generate or template editing",
      "recommendedFix": "Ensure Table 1 header rows and dynamic weekly plan rows are separated or lack nested vertical merges.",
      "confidenceScore": 1.0,
      "occurrencesPrevented": 5
    },
    {
      "ruleCode": "RULE_RPS_ASSESSMENT_TOTAL_100",
      "category": "RPS_PEDAGOGY",
      "title": "Weekly assessment weights must strictly sum to 100%",
      "description": "SN-Dikti requires the cumulative assessment weight across all weeks (including UTS and UAS) to equal exactly 100%.",
      "triggerCondition": "rps.update_section (rencanaMingguan) or rps.audit_compliance",
      "recommendedFix": "Compute sum of weekly bobotPenilaian before saving and warn/reject if sum != 100.",
      "confidenceScore": 1.0,
      "occurrencesPrevented": 12
    },
    {
      "ruleCode": "RULE_TS_STRICT_UNUSED_SYMBOLS",
      "category": "ERROR_AVOIDANCE",
      "title": "TypeScript strict mode rejects unused imports and variables",
      "description": "In apps/web, noUnusedLocals and noUnusedParameters are enabled. Never leave unused imports (e.g. React in React 18, unused icons).",
      "triggerCondition": "code generation in apps/web",
      "recommendedFix": "Clean all unused imports and add explicit parameter types.",
      "confidenceScore": 1.0,
      "occurrencesPrevented": 9
    }
  ]
}
```

#### C. Standard Error Response (RFC 7807)
```json
{
  "type": "https://kampus.rumahku.web.id/errors/validation-failed",
  "title": "RPS Validation Error",
  "status": 422,
  "detail": "Cumulative assessment weight equals 85%, expected 100%.",
  "instance": "/api/v1/ai/actions/execute",
  "traceId": "c4b12f20-992e-4b61-9c12-32a87401124c",
  "errors": [
    {
      "field": "rencanaMingguan",
      "message": "Missing assessment weight for weeks 14 and 15."
    }
  ]
}
```

---

## 9. Multi-Layer Anti-Hallucination Framework

Per project operating principles, any AI interaction that performs troubleshooting, debugging, or validation must adhere to the **3-Layer Anti-Hallucination SOP**:

```
+─────────────────────────────────────────────────────────────────+
|               LAYER 1: PHYSICAL DATABASE CHECK                  |
|  Direct query/dump of database tables and schema.               |
|  - Verify table existence, column types, record counts in SQLite|
|  - Endpoint: `POST /api/v1/ai/actions/execute`                  |
|    action: `db.inspect_table`                                   |
+─────────────────────────────────────────────────────────────────+
                               │
                               ▼
+─────────────────────────────────────────────────────────────────+
|               LAYER 2: API RESPONSE VERIFICATION                |
|  Direct HTTP invocation of API endpoints.                       |
|  - Inspect raw JSON response, HTTP status, and headers          |
|  - Endpoint: `POST /api/v1/ai/actions/execute`                  |
|    action: `api.test_endpoint`                                  |
+─────────────────────────────────────────────────────────────────+
                               │
                               ▼
+─────────────────────────────────────────────────────────────────+
|               LAYER 3: FRONTEND MODEL COMPLIANCE                |
|  Type match between backend response and frontend model/stores. |
|  - Validate Zod schema against incoming API payload             |
|  - Check Zustand store data mapping and React hook form bindings|
+─────────────────────────────────────────────────────────────────+
```

Only when all 3 layers pass is a bug classified as resolved or a feature classified as verified.

---

## 10. Concrete Implementation Roadmap for R2

### Phase 1: Database Migration & Persistence Setup
1. Update `rps-form-app/prisma/schema.prisma` with `AiAgent`, `AiInteractionLog`, `AiErrorLog`, `AiFeedback`, and `AiLearnedRule`.
2. Run `npx prisma db push` or `npx prisma migrate dev --name add_ai_dx_tables`.
3. Create `storage/logs/` directory and ensure write permissions for `ai-agent.jsonl` and `ai-errors.jsonl`.
4. Seed initial `AiLearnedRule` records (DOCX formatting rules, TypeScript strict rules, RPS assessment 100% rule).

### Phase 2: AI DX Core Services (`apps/api/src/services/ai/`)
1. `AiLoggerService.ts`: Dual-logging handler writing asynchronously to Prisma and JSONL files.
2. `AiContextService.ts`: System reflection, database health, and RPS introspection generator.
3. `AiMemoryService.ts`: CRUD for learned rules, error resolution tracking, and pattern retrieval.
4. `AiActionService.ts`: Dispatcher executing structured actions (`rps.audit_compliance`, `rps.update_section`, `export.generate`, etc.).

### Phase 3: AI DX Express Routers (`apps/api/src/routes/ai/`)
1. Implement `aiContextRouter.ts` -> `/api/v1/ai/context/*`
2. Implement `aiActionRouter.ts` -> `/api/v1/ai/actions/*`
3. Implement `aiLearningRouter.ts` -> `/api/v1/ai/history`, `/errors`, `/feedback`, `/learning/rules`
4. Mount all routers under `apps/api/src/server.ts` with `agentAuthMiddleware`.

### Phase 4: Integration with Dosen RPS Features
1. Connect `WizardMockup.tsx` and `Dashboard.tsx` with AI validation and suggestion endpoints.
2. Expose an "AI Audit" badge in the UI displaying compliance with SN-Dikti / OBE criteria.
3. Add a "Beri Feedback AI" widget allowing lecturers to rate suggestions and supply manual corrections.

### Phase 5: Verification & Autonomous Agent Testing
1. Execute automated integration tests verifying all 12 AI DX endpoints.
2. Verify log persistence in both `dev.db` and `storage/logs/ai-agent.jsonl`.
3. Document API reference in `docs/AI_DX_API.md`.
