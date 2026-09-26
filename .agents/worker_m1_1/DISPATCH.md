# Dispatch Assignment: Worker M1 (Architecture, Security & UI/UX Refactoring)

## Working Directory
c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m1_1

## Authoritative User Request
c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md
You MUST read ORIGINAL_REQUEST.md before starting work.

## Reference Documents
- `c:\xampp\htdocs\Aplikasi_Dosen\PROJECT.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_1\analysis.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_1\handoff.md`

## Write Ownership Boundaries
You have exclusive write ownership of:
- `rps-form-app/apps/api/src/**/*`
- `rps-form-app/apps/api/package.json`
- `rps-form-app/apps/web/src/**/*`
- `rps-form-app/apps/web/package.json`
- `rps-form-app/apps/web/index.html`
- `rps-form-app/apps/web/vite.config.ts`
Do NOT write to files in `tests/`, `.agents/` other than your own directory, or root scripts.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks
1. **Frontend TypeScript & Build Fixes**:
   - Fix all TypeScript errors in `apps/web/src` (`TS6133`, `TS7006`, `TS7031`).
   - Fix duplicate `case 4:` in `WizardMockup.tsx`.
   - Remove unused imports across all components.
   - Run `npm run build -w apps/web` and ensure it completes cleanly with exit code 0.
2. **Backend MVC Modularization**:
   - Refactor `apps/api/src/server.ts` into modular layered architecture:
     - `routes/`: modular routers for RPS and templates.
     - `controllers/`: controllers handling HTTP requests and responses.
     - `services/`: business logic for database CRUD, DOCX generation, and PDF conversion.
     - `validators/`: input validation schemas.
     - `middleware/`: error handling, CORS configuration, request logging.
3. **Security Vulnerability Remediation**:
   - Command injection: Replace `exec()` shell interpolation in PDF export with safe `execFile` or `spawn` without shell interpolation, strictly sanitizing input arguments.
   - Arbitrary template overwrite: Add file validation (MIME type, `.docx` extension, format validation) before replacing templates; create automatic backups.
   - CORS: Replace open wildcard with configurable origins from `process.env.CORS_ORIGIN`.
4. **UI/UX & Reactive Data Wiring**:
   - Replace uncontrolled `defaultValue` and static mock submission (`saveMockDataAndGetId`) with real reactive state.
   - Implement functional "Simpan Draft" button that persists draft to the backend.
   - Connect all form sections (General Info, CPL, CPMK, 16-Week Matrix, Evaluation Weights).
   - Remove duplicate sidebar from `/settings` (`TemplateSettingsMockup.tsx`).
   - Fix mobile hamburger menu with working responsive navigation drawer.
   - Replace hardcoded `http://localhost:3000` with relative `/api` or environment-configured API service.
5. **Verification**:
   - Run `npm run build -w apps/api` and `npm run build -w apps/web`. Both must compile cleanly.
   - Test endpoints and form saving.

Write your report to:
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m1_1\changes.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m1_1\handoff.md`
Report back via send_message when complete.

## 2026-09-24T08:02:28Z
Scope & Tasks:
1. Fix all TypeScript errors in apps/web so `npm run build -w apps/web` compiles cleanly with exit code 0.
2. Refactor monolithic `apps/api/src/server.ts` into clean modular MVC (routes, controllers, services, validators, middleware).
3. Eliminate security vulnerabilities: safe PDF conversion command execution without shell injection, validate template uploads, environment-configured CORS.
4. Wire reactive form state into the Wizard component (replacing static mock JSON and uncontrolled defaultValue), connect "Simpan Draft" button to real backend persistence, fix double sidebars on /settings, wire mobile drawer for mobile menu, use relative /api for API requests.
5. Verify both `npm run build -w apps/api` and `npm run build -w apps/web` succeed.

Document all changes and test results in:
- c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m1_1\changes.md
- c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m1_1\handoff.md
Send a completion message back when finished.
