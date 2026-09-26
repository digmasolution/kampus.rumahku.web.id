# Test Plan: Dunia_Kampus E2E Test Suite (Tiers 1-4)

**Author:** E2E Test Writer (Test Track)  
**Target:** Monorepo `Aplikasi_Dosen` / `rps-form-app`  
**Reference:** `ORIGINAL_REQUEST.md`, `PROJECT.md`, `TEST_INFRA.md`  
**Execution Command:** `node tests/runner.js`  

---

## 1. Test Architecture & Runner Design (`tests/runner.js`)

### 1.1 Architecture
The test suite is structured into four distinct verification tiers:
1. **Tier 1 — Feature Coverage**: Verifies all core user stories and system capabilities (RPS CRUD, Template/Export, AI DX Scaffolding, Persistent Logging, VPS deployment scripts & configs).
2. **Tier 2 — Boundary & Corner Cases**: Exercises system resilience at edge values, extreme payloads, assessment weights (<100%, >100%, =100%), authentication bounds, command injection sanitization, and non-docx file rejection.
3. **Tier 3 — Cross-Feature Combinations**: Pairwise end-to-end integration flows (Form submission -> DB persistence -> DOCX stream verification; AI action execution -> DB query -> Context reflection; Deployment artifact packaging -> zip inspection -> manifest check).
4. **Tier 4 — Real-World Workload Scenarios**: Complete lecturer journey for 16-week course "Logika Matematika" (CPL/CPMK mapping, weekly breakdown, draft persistence, export, AI inspection) and multi-tenant VPS isolation & live network probing.

### 1.2 Test Runner Capabilities
- **Zero-Dependency Architecture**: Built on Node.js native libraries (`http`, `fs`, `path`, `crypto`, `child_process`, `stream`), ensuring high performance and zero friction across Windows and Linux/VPS.
- **Self-Healing Server Lifecycle**:
  - Automatically pings the target API endpoint (`http://127.0.0.1:3000` or `process.env.API_URL`).
  - If the server is not running, the runner can automatically spin up the backend API process (`apps/api`), wait for port readiness, run the entire test suite, and cleanly terminate the child process upon test completion.
- **Granular Execution Filtering**:
  - `node tests/runner.js` — runs all 4 tiers sequentially.
  - `node tests/runner.js --tier 1` — runs only Tier 1 suites.
  - `node tests/runner.js --tier 2` — runs only Tier 2 suites.
  - `node tests/runner.js --tier 3` — runs only Tier 3 suites.
  - `node tests/runner.js --tier 4` — runs only Tier 4 suites.
  - `node tests/runner.js --file <name>` — runs an individual test file.
- **Strict Diagnostics & Assertion Reporting**:
  - Detailed assertion failure traces (Expected vs Actual).
  - Clear distinction between passing features, schema validation rejections, and pending features.
  - Generates comprehensive execution summary table and overall exit status code.

---

## 2. Test Specifications by Tier

### Tier 1: Feature Coverage (>=5 tests per area)

#### 1. `tests/tier1_feature/test_rps_crud.js`
- **T1.1.1 (Create RPS)**: POST `/api/rps` with valid metadata (`title`, `courseName`, `courseCode`, `data`). Expected: 200/201, returns object with generated `id`, `status: 'DRAFT'`, matching metadata.
- **T1.1.2 (Get RPS by ID)**: GET `/api/rps/:id`. Expected: 200, returns exact record with matching `courseCode` and parsed `dataJson`.
- **T1.1.3 (Update RPS)**: PUT `/api/rps/:id` with modified `title`, `courseName`, `status: 'FINAL'`. Expected: 200, returns updated record reflecting changes.
- **T1.1.4 (List RPS)**: GET `/api/rps`. Expected: 200, returns an array containing the previously created record.
- **T1.1.5 (404 Non-existent ID)**: GET `/api/rps/invalid-uuid-9999`. Expected: 404, returns JSON error payload `{ "error": "Not found" }` or equivalent.

#### 2. `tests/tier1_feature/test_export_endpoints.js`
- **T1.2.1 (DOCX Export Valid RPS)**: GET `/api/rps/:id/export/docx`. Expected: 200, Content-Type contains `application/vnd.openxmlformats` or `octet-stream`, response buffer begins with zip signature `PK\x03\x04` (`0x504B0304`).
- **T1.2.2 (DOCX Export Non-Existent)**: GET `/api/rps/unknown-id-8888/export/docx`. Expected: 404, returns JSON error message.
- **T1.2.3 (Template Existence & Validity)**: Inspect `templates/processed/rps-template-processed.docx`. Expected: File exists, size > 10KB, contains valid OpenXML structure (`[Content_Types].xml`, `word/document.xml`).
- **T1.2.4 (Template Upload Endpoint)**: POST `/api/templates/upload` with multipart valid DOCX file. Expected: 200, returns `{ "success": true }`.
- **T1.2.5 (PDF Export Handling)**: GET `/api/rps/:id/export/pdf`. Expected: Valid PDF stream with `%PDF` header (if LibreOffice is present) or predictable 400/500 with descriptive prerequisite warning.

#### 3. `tests/tier1_feature/test_ai_dx_endpoints.js`
- **T1.3.1 (AI Context Introspection)**: GET `/api/v1/ai/context` with `X-Agent-Key: test-agent-key`. Expected: 200, returns system information, active template placeholder tags, and active schema rules.
- **T1.3.2 (AI Context Unauthorized)**: GET `/api/v1/ai/context` without `X-Agent-Key`. Expected: 401 Unauthorized.
- **T1.3.3 (Action Catalog)**: GET `/api/v1/ai/actions/catalog`. Expected: 200, returns action definitions including `rps.create`, `rps.update`, `rps.validate`, `system.run_doctor`.
- **T1.3.4 (Action Execution RPC)**: POST `/api/v1/ai/actions/execute` with `{ action: "rps.create", parameters: { title: "AI Gen RPS", courseCode: "AI101", courseName: "Kecerdasan Buatan" } }`. Expected: 200, returns `{ success: true, result: { id: ... }, traceId: ... }`.
- **T1.3.5 (AI Learning Rules)**: GET `/api/v1/ai/learning/rules`. Expected: 200, returns list of learned rules and architectural constraints.

#### 4. `tests/tier1_feature/test_persistent_logs.js`
- **T1.4.1 (AI Agent Telemetry JSONL)**: Verify `storage/logs/ai-agent.jsonl` exists and contains valid JSON lines with `timestamp`, `agentKey` or `agentName`, `action`, `traceId`.
- **T1.4.2 (AI Error Telemetry JSONL)**: Verify `storage/logs/ai-errors.jsonl` logs execution anomalies with error code and stack details.
- **T1.4.3 (Database Persistence Telemetry)**: Query SQLite `dev.db` for `AiInteractionLog` records. Expected: Count >= 1 matching executed actions.
- **T1.4.4 (Feedback Ingestion)**: POST `/api/v1/ai/learning/feedback` with `{ agentName: "QA-Runner", feedbackType: "ACCURACY", content: "Validated CPL schema" }`. Expected: 200, recorded in database or feedback log.
- **T1.4.5 (3-Layer Anti-Hallucination Diagnostic)**: Verify 3-layer consistency between SQLite schema, API responses, and frontend expectations.

#### 5. `tests/tier1_feature/test_vps_scripts.js`
- **T1.5.1 (PowerShell Deployment Script)**: Verify `deploy.ps1` exists, targets VPS `38.103.170.236` and domain `kampus.rumahku.web.id`, forbids `scp -r`, and utilizes local zip + remote `unzip -o`.
- **T1.5.2 (Bash Deployment Script)**: Verify `deploy.sh` exists, is POSIX/bash compliant, forbids `scp -r`, and uses `unzip -o`.
- **T1.5.3 (Fallback HTTP Script)**: Verify `fix_server.php` exists, contains self-extracting / fixing HTTP recovery logic, and supports 1-click execution.
- **T1.5.4 (Apache VirtualHost Config)**: Verify `kampus.conf` configures `ServerName kampus.rumahku.web.id`, `DocumentRoot /var/www/kampus-dosen/current/apps/web/dist`, and reverse proxy `/api` to port `3005`.
- **T1.5.5 (Systemd Service Config)**: Verify `kampus-api.service` runs `node` with working directory `/var/www/kampus-dosen/current/apps/api` and `PORT=3005`.

---

### Tier 2: Boundary & Corner Cases (>=5 tests per boundary class)

#### 1. `tests/tier2_boundary/test_empty_boundary.js`
- **T2.1.1 (Empty POST Body)**: POST `/api/rps` with `{}`. Expected: Graceful fallback with defaults or clean 400 validation error without unhandled server exception.
- **T2.1.2 (Empty Course Code and Name)**: POST `/api/rps` with `{ courseCode: "", courseName: "" }`. Expected: Validated with default fallback or 400 error.
- **T2.1.3 (Oversized Payload Stress)**: POST `/api/rps` with 2MB JSON data payload. Expected: Handled cleanly by JSON body parser without process crash.
- **T2.1.4 (Empty Weekly Plan Matrix)**: POST `/api/rps` with `{ data: { weeklyPlan: [] } }`. Expected: Persists without crash.
- **T2.1.5 (Deeply Nested JSON)**: POST `/api/rps` with 15-level deeply nested JSON objects. Expected: Serialized and retrieved intact.

#### 2. `tests/tier2_boundary/test_max_weight_boundary.js`
- **T2.2.1 (Valid 100% Weight Sum)**: Assessment weights { UTS: 30%, UAS: 35%, Tugas: 20%, Kuis: 10%, Keaktifan: 5% } = exactly 100%. Expected: Validation succeeds (`isValid: true`, warnings: []).
- **T2.2.2 (Underflow < 100% Weight)**: Assessment weights totaling 80%. Expected: Validation rejects or raises pedagogical warning.
- **T2.2.3 (Overflow > 100% Weight)**: Assessment weights totaling 120%. Expected: Validation rejects or raises pedagogical warning.
- **T2.2.4 (Negative Weight Value)**: Assessment component with weight -15%. Expected: Strict rejection (400 validation error).
- **T2.2.5 (Zero-Weight & Boundary Components)**: Component with exactly 0% weight and floating-point 99.99% vs 100.00% precision handling.

#### 3. `tests/tier2_boundary/test_invalid_tokens.js`
- **T2.3.1 (Missing Token Header)**: Request to `/api/v1/ai/*` without `X-Agent-Key`. Expected: 401 Unauthorized.
- **T2.3.2 (Malformed Token Header)**: Request with `X-Agent-Key: "   "`. Expected: 401 Unauthorized.
- **T2.3.3 (Invalid Arbitrary Token)**: Request with `X-Agent-Key: "random-fake-key-12345"`. Expected: 401 Unauthorized.
- **T2.3.4 (SQL Injection in Token Header)**: Request with `X-Agent-Key: "' OR '1'='1"`. Expected: 401 Unauthorized.
- **T2.3.5 (Tampered Bearer Authorization)**: Request with `Authorization: Bearer invalid.jwt.payload`. Expected: 401 Unauthorized.

#### 4. `tests/tier2_boundary/test_injection_sanitization.js`
- **T2.4.1 (Shell Metacharacter in Course Code)**: Create RPS with `courseCode: "MATH101; rm -rf / ;"`. Trigger export. Expected: Course code is sanitized or passed safely via execFile/spawn without executing shell commands.
- **T2.4.2 (Windows Shell Metacharacters)**: Create RPS with `courseCode: "CS101 & calc.exe &"`. Expected: Safe parameter isolation.
- **T2.4.3 (Path Traversal in Template Upload)**: Upload template with filename `../../../../etc/passwd` or `..\\..\\windows\\win.ini`. Expected: Path traversal neutralized, written only to designated upload directory.
- **T2.4.4 (SQL Injection in RPS ID)**: GET `/api/rps/' OR 1=1 --`. Expected: 404 Not Found (safe parameterized Prisma query).
- **T2.4.5 (XSS in RPS Title)**: POST `/api/rps` with `<script>alert('XSS')</script>`. Expected: Safely stored as raw string without execution or corruption.

#### 5. `tests/tier2_boundary/test_malformed_inputs.js`
- **T2.5.1 (Non-DOCX Upload)**: Upload plain text file `.txt` disguised as `.docx`. Expected: 400 Bad Request (file type validation).
- **T2.5.2 (Corrupt ZIP Upload)**: Upload arbitrary random binary bytes to `/api/templates/upload`. Expected: 400 Bad Request.
- **T2.5.3 (Malformed JSON POST Body)**: Send invalid raw JSON `{"title": "broken` with `Content-Type: application/json`. Expected: 400 Bad Request.
- **T2.5.4 (Unknown AI Action Name)**: POST `/api/v1/ai/actions/execute` with `{ action: "unknown.action.xyz" }`. Expected: 400/404 Action Not Found.
- **T2.5.5 (Invalid Parameter Types to Action RPC)**: POST `/api/v1/ai/actions/execute` with `{ action: "rps.create", parameters: "not-an-object" }`. Expected: 400 Validation Error.

---

### Tier 3: Cross-Feature Combinations

#### 1. `tests/tier3_pairwise/test_draft_export_flow.js`
- Form state submission -> Database persistence -> DOCX stream verification:
  - Create RPS with rich CPL/CPMK and author metadata.
  - Verify SQLite persistence.
  - Request DOCX stream.
  - Parse returned DOCX using `pizzip` / zip inspection.
  - Verify `word/document.xml` contains exact lecturer name, course code, and institution name.
  - Test pairwise combinations of SKS formats (2 SKS, 3 SKS, 4 SKS) and draft statuses ('DRAFT', 'SUBMITTED', 'APPROVED').

#### 2. `tests/tier3_pairwise/test_ai_action_rps_sync.js`
- AI Agent Action Execution -> DB Persistence -> Context Introspection:
  - Invoke `POST /api/v1/ai/actions/execute` with `rps.create`.
  - Extract returned document ID.
  - Directly query `/api/rps/:id` to confirm persistent existence.
  - Query `/api/v1/ai/context` to verify state change is reflected in system context.
  - Invoke `rps.update` to modify weights.
  - Verify audit log entry in `storage/logs/ai-agent.jsonl`.

#### 3. `tests/tier3_pairwise/test_deploy_package_contents.js`
- Packaging script execution -> Zip archive inspection -> Deployment layout check:
  - Inspect packaging script and/or generated `web_build.zip`.
  - Validate zip contains: `apps/web/dist`, `apps/api`, `prisma/schema.prisma`, `templates/processed`.
  - Validate zip STRICTLY excludes: `node_modules`, `.git`, `.env`.
  - Verify extraction path alignment with `/var/www/kampus-dosen`.

---

### Tier 4: Real-World Workload Scenarios

#### 1. `tests/tier4_workload/test_end_to_end_lecturer_journey.js`
- Complete realistic lecturer journey for "Logika Matematika" (MAT201):
  1. Lecturer Dian Kristanti logs in/initializes "Logika Matematika" (2 SKS: Teori 2, Praktik 0).
  2. Enters Capaian Pembelajaran Lulusan (CPL-PRODI): S-1 (Sikap), P-1 (Pengetahuan), KU-1 (Keterampilan Umum), KK-1 (Keterampilan Khusus).
  3. Enters Capaian Pembelajaran Mata Kuliah (CPMK-1 through CPMK-4).
  4. Fills complete 16-Week Lesson Plan:
     - Week 1: Pengantar Logika & Pernyataan Majemuk
     - Week 2: Tabel Kebenaran (Konjungsi, Disjungsi, Implikasi, Biimplikasi)
     - Week 3: Tautologi, Kontradiksi, Kontingensi
     - Week 4: Hukum-hukum Logika Proposisi & Ekuivalensi Logis
     - Week 5: Aljabar Proposisi & Bentuk Normal (CNF, DNF)
     - Week 6: Argumen Valid & Inferensi Logika (Modus Ponens, Modus Tollens, Silogisme)
     - Week 7: Logika Predikat & Kuantor (Universal, Eksistensial)
     - Week 8: Evaluasi Tengah Semester (UTS)
     - Week 9: Pengantar Himpunan & Operasi Himpunan
     - Week 10: Prinsip Inklusi-Eksklusi & Diagram Venn
     - Week 11: Relasi & Sifat-sifat Relasi (Refleksif, Simetris, Transitif)
     - Week 12: Relasi Ekivalensi & Relasi Pengurutan Parsial (Poset)
     - Week 13: Fungsi & Sifat-sifat Fungsi (Injektif, Surjektif, Bijektif)
     - Week 14: Prinsip Induksi Matematika Lemah & Kuat
     - Week 15: Penerapan Logika Matematika pada Rangkaian Digital & Algoritma
     - Week 16: Evaluasi Akhir Semester (UAS)
  5. Sets evaluation weights: UTS (30%), UAS (35%), Tugas (20%), Kuis (10%), Keaktifan (5%) = 100%.
  6. Saves as Draft -> Re-opens and updates Week 15 -> Saves changes.
  7. Triggers DOCX generation -> Verifies exported document contains full 16-week matrix.
  8. AI Agent inspects document compliance via `/api/v1/ai/context/rps/:id` -> Verifies 100% completeness.

#### 2. `tests/tier4_workload/test_vps_isolation_and_live_http.js`
- Multi-Tenant VPS Isolation & Live Verification:
  1. Inspects Apache vhost configuration to verify strict isolation between `kampus.rumahku.web.id` (`/var/www/kampus-dosen`) and other tenants (`/var/www/syukran-laravel`, `/var/www/arabiq-api`, `/var/www/uncm-backend`).
  2. Verifies reverse proxy port 3005 is isolated to `127.0.0.1`.
  3. Verifies shared directory permissions and isolation of `database.sqlite`.
  4. Performs live HTTP check against target VPS `38.103.170.236` / `kampus.rumahku.web.id` with timeout resilience.

---

## 3. Success Criteria & Delivery Artifacts
- **All 4 Tiers Implemented**: 15 test suites across Tiers 1-4.
- **Pass Threshold**: All verifiable tests against implemented features pass; pending features provide clear diagnostics.
- **Delivery Document**: `TEST_READY.md` published at `c:\xampp\htdocs\Aplikasi_Dosen\TEST_READY.md`.
