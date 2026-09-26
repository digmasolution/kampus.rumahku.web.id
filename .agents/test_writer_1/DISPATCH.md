# Dispatch Assignment: E2E Test Writer (Test Track)

## Working Directory
c:\xampp\htdocs\Aplikasi_Dosen\.agents\test_writer_1

## Authoritative User Request
c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md
You MUST read ORIGINAL_REQUEST.md before starting work.

## Reference Documents
- `c:\xampp\htdocs\Aplikasi_Dosen\PROJECT.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\TEST_INFRA.md`

## Write Ownership Boundaries
You have exclusive write ownership of:
- `tests/**/*`
- `TEST_READY.md` (publish at project root when complete)
Do NOT modify application source code in `rps-form-app/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All tests must be genuine, independent, opaque-box tests derived from user requirements and specifications. Do NOT create tests that trivially pass or check hardcoded mock strings.

## Tasks
1. Build the unified test runner at `tests/runner.js`.
2. Implement **Tier 1 (Feature Coverage)** tests (>=5 per feature area):
   - RPS CRUD operations (create, read, update, list).
   - Template upload validation & export endpoints (DOCX and PDF format response headers/content).
   - AI DX endpoints (`/api/v1/ai/context`, `/actions/catalog`, `/actions/execute`).
   - Persistent logging checks (verifying entries in SQLite tables and JSONL log files).
   - Deployment script validation (verifying `web_build.zip` creation, file contents, exclusion of node_modules, existence of `deploy.ps1`, `deploy.sh`, `fix_server.php`).
3. Implement **Tier 2 (Boundary & Corner Cases)** tests (>=5 per boundary class):
   - Empty input handling, oversized fields.
   - Assessment weight boundaries (< 100%, > 100%, exactly 100%).
   - Invalid authentication tokens on AI endpoints.
   - Command injection payload sanitization.
   - Non-docx file upload rejections.
4. Implement **Tier 3 (Cross-Feature Combinations)** tests:
   - Form submission -> DB persistence -> DOCX stream verification.
   - AI action execution (`rps.create`) -> DB query -> Context reflection.
   - Deployment artifact packaging -> zip inspection -> manifest check.
5. Implement **Tier 4 (Real-World Workload Scenarios)** tests:
   - Complete lecturer journey: Create full 16-week course syllabus for "Logika Matematika" with CPL/CPMK, save draft, update weeks, export DOCX, query AI context.
   - Multi-tenant VPS isolation check (mock virtual host headers, path verification).
6. When all test suites are written and verified, create `TEST_READY.md` at project root with the coverage summary.

Write your report to:
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\test_writer_1\test_plan.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\test_writer_1\handoff.md`
Report back via send_message when complete.

## 2026-09-24T08:02:28Z
You are E2E Test Writer (Test Track).
Your working directory is: c:\xampp\htdocs\Aplikasi_Dosen\.agents\test_writer_1
Read your assignment in: c:\xampp\htdocs\Aplikasi_Dosen\.agents\test_writer_1\DISPATCH.md
The authoritative user request is at: c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md

You MUST read ORIGINAL_REQUEST.md before starting work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All tests must be genuine, independent, opaque-box tests derived from user requirements and specifications. Do NOT create tests that trivially pass or check hardcoded mock strings.

Scope & Tasks:
1. Build the unified test runner at `tests/runner.js`.
2. Implement Tier 1 (Feature Coverage), Tier 2 (Boundary & Corner Cases), Tier 3 (Cross-Feature Combinations), and Tier 4 (Real-World Application Scenarios) per `TEST_INFRA.md`.
3. When test suite is complete and self-verified, publish `TEST_READY.md` at project root (`c:\xampp\htdocs\Aplikasi_Dosen\TEST_READY.md`).

Document test design and results in:
- c:\xampp\htdocs\Aplikasi_Dosen\.agents\test_writer_1\test_plan.md
- c:\xampp\htdocs\Aplikasi_Dosen\.agents\test_writer_1\handoff.md
Send a completion message back when finished.

