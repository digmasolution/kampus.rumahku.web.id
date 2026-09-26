# Handoff Report: Explorer Survey 2 (AI DX & Ecosystem Requirements)

**Sender**: Explorer Survey 2 (AI DX & Ecosystem Requirements)  
**Recipient**: Parent Orchestrator (`44799afd-2d36-4b3b-884a-c0678f464e8a`)  
**Working Directory**: `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_2`  
**Reference Document**: `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_2\analysis.md`  
**Type**: Hard Handoff (Investigation & Specification Complete)  

---

## 1. Observation

Direct physical observations of the codebase (`c:\xampp\htdocs\Aplikasi_Dosen`):

1. **Backend Routing & Monolithic Controller Structure**:
   - `rps-form-app/apps/api/src/server.ts` contains all routes inline in a single 166-line file.
   - Folders `controllers/`, `routes/`, `services/`, `validators/`, `templates/`, and `exporters/` under `rps-form-app/apps/api/src/` exist but are completely empty (0 files).
   - Endpoints present:
     - `GET /api/rps` (line 18)
     - `POST /api/rps` (line 25)
     - `GET /api/rps/:id` (line 37)
     - `PUT /api/rps/:id` (line 43)
     - `GET /api/rps/:id/export/docx` (line 57)
     - `GET /api/rps/:id/export/pdf` (line 114)
     - `POST /api/templates/upload` (line 143)
   - Zero AI DX endpoints or agent routes (`/api/ai/*` or `/api/agent/*`) exist.

2. **Error Logging & Telemetry Facilities**:
   - No structured logging framework (`winston`, `pino`, `morgan`) is installed in `apps/api/package.json`.
   - Logging in `server.ts` is limited to:
     - `console.error(error)` (line 102)
     - `console.error("errorMessages", errorMessages)` (line 107)
     - `console.error("LibreOffice error:", err)` (line 132)
   - In `apps/web/src/pages/WizardMockup.tsx` (lines 53, 71, 83) and `TemplateSettingsMockup.tsx`, errors are handled exclusively via browser synchronous `alert(...)`.
   - No log directory (`storage/logs/`) exists in the active workflow, and no persistent log files are generated.

3. **Database Schema & Current Data**:
   - `rps-form-app/prisma/schema.prisma` specifies SQLite database (`DATABASE_URL="file:./dev.db"`) with 3 models: `User`, `RpsDocument`, `Template`.
   - Direct database inspection via Node CLI confirmed:
     - `Users`: 0 records
     - `RpsDocs`: 4 records (`d2097dcd-9945-4adc-aa9d-302901f27733`, `09eeabb6-5f76-4d9f-bc5c-fc8d9861297e`, `583def95-a4cc-4154-b391-da5992776f88`, `96d31658-5c49-4295-8c38-5279d346e5af`)
     - `Templates`: 0 records
   - There are zero tables for AI agent sessions, interaction logs, error logs, feedback, or learned memory.

4. **Template & Field Capabilities**:
   - Tag extraction from `rps-form-app/templates/processed/rps-template-processed.docx` via `pizzip` revealed only 10 active tags:
     `{{INSTITUSI}}`, `{{PROGRAM_STUDI}}`, `{{SKS}}`, `{{NAMA_MATA_KULIAH}}`, `{{KODE_MATA_KULIAH}}`, `{{SKS_T}}`, `{{SKS_P}}`, `{{TANGGAL_PENYUSUNAN}}`, `{{DOSEN_PENGEMBANG}}`, `{{KOORDINATOR_MATA_KULIAH}}`.
   - The entire 16-week matrix, CPL, CPMK, Sub-CPMK, and rubric are not yet templated into dynamic tags in `rps-template-processed.docx`.

5. **Diagnostic Tooling (`scripts/doctor.js`)**:
   - Executing `node scripts/doctor.js` passed for Node (v24.13.1), NPM (11.8.0), SQLite database (`dev.db`), and storage directories, but failed on LibreOffice (`soffice` not found on local Windows path).

6. **Frontend TypeScript Strict Mode Failures**:
   - Executing `npm run build -w apps/web` failed with code 2 due to 9 TypeScript compiler errors:
     `App.tsx(1,1): error TS6133: 'React' is declared but its value is never read.`
     `App.tsx(10,21): error TS7006: Parameter 'path' implicitly has an 'any' type.`
     `App.tsx(44,19): error TS7031: Binding element 'children' implicitly has an 'any' type.`
     `Dashboard.tsx(1,8): error TS6133: 'React' is declared but its value is never read.`
     `DashboardMockup.tsx(1,1): error TS6133: 'React' is declared but its value is never read.`
     `TemplateSettingsMockup.tsx(1,8): error TS6133: 'React' is declared but its value is never read.`
     `TemplateSettingsMockup.tsx(3,43): error TS6133: 'AlertTriangle' is declared but its value is never read.`
     `WizardMockup.tsx(1,8): error TS6133: 'React' is declared but its value is never read.`
     `WizardMockup.tsx(2,1): error TS6133: 'Link' is declared but its value is never read.`

---

## 2. Logic Chain

1. **From Observation 1 & 2 to Need for Scaffolding**:
   Because `apps/api/src/server.ts` is monolithic and completely lacks `/api/ai/*` routes, external agents have zero standardized entry points to introspect system state, execute tools, or safely update RPS documents without risky direct database mutations. Modularizing the Express app and introducing `/api/v1/ai/*` endpoints with `agentAuthMiddleware` provides the necessary scaffolding.

2. **From Observation 2 & 3 to Persistent Logging & Mistake Tracking**:
   Because logs currently vanish into stdout with no trace IDs or persistence, and errors are shown to users via raw browser alerts, neither human developers nor AI agents can analyze past errors or learn from failures. Introducing Prisma models (`AiInteractionLog`, `AiErrorLog`, `AiFeedback`, `AiLearnedRule`) and append-only files (`storage/logs/ai-agent.jsonl`, `storage/logs/ai-errors.jsonl`) provides a verifiable, dual-layer persistent memory store.

3. **From Observation 4 to Context Introspection & Domain Realities**:
   Because the active template currently supports only 10 metadata tags while the full RPS document (`docs/document-structure.md`) requires extensive pedagogic structures (16 weeks, Bloom's Taxonomy, CPL/CPMK correlation matrix), agents will hallucinate or corrupt document rendering if not provided exact placeholder reflection. A dedicated `GET /api/v1/ai/context` endpoint returning active template tags and schema validation rules grounds the agent in real system constraints.

4. **From Observation 5 & 6 to Continuous Learning Knowledge Seeding**:
   The failure of `npm run build -w apps/web` (due to `TS6133` and `TS7006`) and the absence of LibreOffice on Windows represent real failure cases. These provide the initial seed entries for `AiLearnedRule`:
   - `RULE_TS_STRICT_UNUSED_SYMBOLS`: Enforce removal of unused imports and explicit typing in `apps/web`.
   - `RULE_DOCX_NO_VERTICAL_MERGE_LOOP`: Prevent XML layout corruption in Word export.
   - `RULE_RPS_ASSESSMENT_TOTAL_100`: Enforce 100% assessment weight sum in 16-week matrix.

---

## 3. Caveats

1. **VPS Deployment Differences**: On the production VPS (`38.103.170.236` / `kampus.rumahku.web.id`), Linux will have `soffice` available if `libreoffice-core` is installed via apt, whereas local Windows lacks LibreOffice in PATH. The AI DX health check must dynamically detect and report this capability.
2. **Template Evolution**: If subsequent surveys or implementations expand `rps-template-processed.docx` to support table loops for weeks 1-16, the `placeholderSchema` in the `Template` table and the context introspection reflection must be refreshed dynamically.
3. **Authentication Scope**: The proposed `X-Agent-Key` token model is lightweight and suited for local and private VPS deployment. If multi-tenant public access is later required, OAuth2 / JWT integration will be needed.

---

## 4. Conclusion

The current codebase has zero AI DX integration, lacks structured error logging, and has no persistent learning mechanism. However, its Express/TypeScript/Prisma architecture allows for a seamless, modular addition of R2 capabilities without breaking existing features:
- **Scaffolding**: Mount modular router `/api/v1/ai` with context introspection (`/context`), structured action execution (`/actions/execute`), and tool catalog (`/actions/catalog`).
- **Continuous Learning & Memory**: Extend Prisma schema with 5 dedicated models (`AiAgent`, `AiInteractionLog`, `AiErrorLog`, `AiFeedback`, `AiLearnedRule`) and implement append-only JSONL files in `storage/logs/`.
- **Anti-Hallucination Grounding**: Enforce 3-layer verification (Physical SQLite DB, API JSON response, Frontend Zod/React model) within all AI agent diagnostic tools.

Full technical specifications, SQL schemas, and endpoint request/response payloads are authored in `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_2\analysis.md`.

---

## 5. Verification Method

To independently verify the findings and future R2 implementation:

1. **Verify Backend Build & SQLite Database**:
   ```bash
   cd c:\xampp\htdocs\Aplikasi_Dosen\rps-form-app
   npm run build -w apps/api
   node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.rpsDocument.count().then(c => console.log('RpsCount:', c));"
   ```
   *Expected*: Build exits 0; RpsCount is 4.

2. **Verify Frontend Build TypeScript Failure (Known Bug Documented in Analysis)**:
   ```bash
   cd c:\xampp\htdocs\Aplikasi_Dosen\rps-form-app
   npm run build -w apps/web
   ```
   *Expected*: Fails with TS6133 / TS7006 errors as documented in Section 1.

3. **Verify AI DX Scaffolding & Endpoints (Post-Implementation)**:
   ```bash
   # 1. Health & Context Introspection
   curl -s -H "X-Agent-Key: test_key" http://localhost:3000/api/v1/ai/context
   
   # 2. Tool Catalog Reflection
   curl -s -H "X-Agent-Key: test_key" http://localhost:3000/api/v1/ai/actions/catalog
   
   # 3. Learned Rules Memory Retrieval
   curl -s -H "X-Agent-Key: test_key" http://localhost:3000/api/v1/ai/learning/rules
   
   # 4. Action Execution (e.g. Doctor Diagnostics)
   curl -s -X POST -H "Content-Type: application/json" -H "X-Agent-Key: test_key" \
     -d '{"action": "system.run_doctor", "parameters": {}}' \
     http://localhost:3000/api/v1/ai/actions/execute
   ```

4. **Verify Persistent File & DB Logging (Post-Implementation)**:
   - Check SQLite tables: `SELECT count(*) FROM AiInteractionLog;`
   - Check file stream: Inspect `rps-form-app/storage/logs/ai-agent.jsonl` and `ai-errors.jsonl`.
