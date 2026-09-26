# Changes Report: Worker M1 (Architecture, Security & UI/UX Refactoring)

**Worker:** Worker M1  
**Date:** 2026-09-24  
**Milestone:** M1 (Architecture, Security & UI/UX Refactoring)  
**Status:** COMPLETE  

---

## 1. Summary of Changes

Milestone 1 successfully resolved all critical architecture, security, and usability issues identified in the codebase audit:
1. **Frontend TypeScript & Build Remediation**: Fixed all TS errors (`TS6133`, `TS7006`, `TS7031`), added `vite-env.d.ts`, and resolved duplicate switch cases. `npm run build -w apps/web` compiles cleanly with exit code 0.
2. **Backend MVC Architecture**: Deconstructed the 166-line monolithic `apps/api/src/server.ts` into a clean modular layered MVC architecture:
   - `src/config/`: Robust environment configuration and dynamic app root resolution.
   - `src/middleware/`: Configurable origin CORS, request logging, and centralized error handling adhering to standard JSON envelope `{ success: false, error: { code, message, details } }`.
   - `src/validators/`: Zod schemas for input validation and strict sanitization.
   - `src/services/`: Pure business logic for RPS CRUD with completion percentage calculation, Docxtemplater generation with complete data mapping, safe PDF conversion, and secure template management with automated backups.
   - `src/controllers/`: Express controllers mapping HTTP request/response.
   - `src/routes/`: Express routers modularized into `/api/rps` and `/api/templates`.
3. **Security Vulnerability Elimination**:
   - **Command Injection**: Replaced `exec()` shell interpolation in PDF export with safe `execFile` argument array, disabling shell execution (`shell: false`), and added Zod regex whitelisting for course codes (`/^[A-Za-z0-9_-]*$/`).
   - **Template Overwrite & Tampering**: Added strict MIME and extension validation (`.docx`), ZIP format structure verification (`word/document.xml`), and automatic timestamped backup creation before replacing active templates.
   - **CORS Hardening**: Replaced open wildcard `cors()` with origin validation checking `process.env.CORS_ORIGIN` alongside local and domain whitelists (`kampus.rumahku.web.id`).
4. **UI/UX Modernization & Reactive Wiring**:
   - Implemented reactive Zustand state management (`useRpsStore.ts`) across all 9 steps in the RPS Wizard.
   - Replaced uncontrolled `defaultValue` and static mock payloads with real reactive state.
   - Connected the "Simpan Draft" button to persist form drafts to backend `/api/rps` (POST/PUT) with real-time feedback notifications.
   - Added interactive dynamic row additions and removals for CPL (Step 3), 16-Week Lesson Plan (Step 6), and Penilaian (Step 7) with live percentage sum calculations.
   - Eliminated the duplicate nested sidebar bug on `/settings` (`TemplateSettingsMockup.tsx`).
   - Implemented a fully functional slide-over mobile navigation drawer in `App.tsx` triggered by the hamburger icon.
   - Replaced hardcoded `http://localhost:3000` with relative `/api` across all frontend components and configured the Vite dev reverse proxy.

---

## 2. Detailed File Modifications

### 2.1 Backend (`rps-form-app/apps/api`)

| File Path | Change Type | Description |
|---|---|---|
| `package.json` | Modified | Added `dotenv` dependency for environment configuration. |
| `src/config/index.ts` | Created | Dynamic app root resolver and environment configuration (`PORT`, `CORS_ORIGIN`, storage & template directories). |
| `src/middleware/cors.ts` | Created | Configurable CORS middleware supporting `CORS_ORIGIN` env variable and allowed domain lists. |
| `src/middleware/errorHandler.ts` | Created | Centralized error handler returning standard `{ success: false, error: { code, message, details } }` contract. |
| `src/middleware/logger.ts` | Created | HTTP request logging middleware with method, URL, status code, and latency. |
| `src/validators/rps.validator.ts` | Created | Zod schema validating RPS creation/updating and sanitizing course codes against shell metacharacters. |
| `src/validators/template.validator.ts` | Created | Validates uploaded DOCX templates (checks extension, size limit, and `word/document.xml` ZIP structure). |
| `src/services/rps.service.ts` | Created | Prisma database operations, search/filtering, and automatic calculation of `completionPercentage`. |
| `src/services/docx.service.ts` | Created | Docxtemplater rendering engine with full field mapping (Header, CPL, Weekly Plan, Penilaian, Referensi). |
| `src/services/pdf.service.ts` | Created | Secure PDF converter using `execFile` with argument isolation; handles LibreOffice absence gracefully without crashing. |
| `src/services/template.service.ts` | Created | Template management with metadata inspection, automated timestamped backups, and safe replacement. |
| `src/controllers/rps.controller.ts` | Created | Controller handling RPS listing, detail lookup, creation, update, deletion, and DOCX/PDF export streaming. |
| `src/controllers/template.controller.ts` | Created | Controller handling template status retrieval and upload. |
| `src/routes/rps.routes.ts` | Created | Modular router for `/api/rps` endpoints. |
| `src/routes/template.routes.ts` | Created | Modular router for `/api/templates` with Multer file upload. |
| `src/routes/index.ts` | Created | Central router mounting `/rps`, `/templates`, and `/health`. |
| `src/exporters/index.ts` | Created | Barrel export for exporter services. |
| `src/templates/index.ts` | Created | Barrel export for template services. |
| `src/server.ts` | Modified | Clean entrypoint importing modular routers, middlewares, and starting the Express server. |

### 2.2 Frontend (`rps-form-app/apps/web`)

| File Path | Change Type | Description |
|---|---|---|
| `vite.config.ts` | Modified | Added `/api` reverse proxy configuration targeting `http://localhost:3000`. |
| `src/vite-env.d.ts` | Created | TypeScript definitions for Vite client and `import.meta.env.VITE_API_URL`. |
| `src/types/rps.ts` | Created | Shared TypeScript interfaces for RPS models, steps, and template metadata. |
| `src/services/api.ts` | Created | Axios API client using relative `/api` baseURL with typed methods for all endpoints. |
| `src/stores/useRpsStore.ts` | Created | Reactive Zustand store managing wizard draft state, auto-save, draft persistence, and live calculations. |
| `src/App.tsx` | Modified | Fixed all TypeScript type errors (`path: string`, `children: ReactNode`), added mobile drawer navigation, updated branding to Dunia Kampus (Portal Dosen). |
| `src/pages/TemplateSettingsMockup.tsx` | Modified | Removed duplicate nested sidebar, fixed unused symbols, connected template upload and status to API. |
| `src/pages/WizardMockup.tsx` | Modified | Fixed duplicate `case 4:`, converted all 9 steps to controlled reactive inputs, added working Add/Delete row handlers, connected "Simpan Draft" button to backend persistence, wired DOCX and PDF exports. |
| `src/pages/DashboardMockup.tsx` | Modified | Connected to backend API `getRpsList()` to render real saved documents, added functional search and status filters, and enabled clicking to edit draft. |
| `src/pages/Dashboard.tsx` | Modified | Fixed unused symbols and converted to use typed API client. |

---

## 3. Test & Verification Results

1. **Compilation Build Verification**:
   - `npm run build -w apps/api`: PASSED (Exit code: 0)
   - `npm run build -w apps/web`: PASSED (Exit code: 0)
   - `npm run build` (monorepo root): PASSED (Exit code: 0)
2. **Automated Verification Suite (`verify_m1.js`)**:
   - Total Tests: 18
   - Passed: 18
   - Failed: 0
   - Health check: 200 OK
   - Template metadata inspection: 200 OK
   - RPS CRUD lifecycle: 201 Created -> 200 Read -> 200 Updated -> 200 Deleted -> 404 Not Found
   - DOCX Export: 200 OK, valid ZIP binary header (`PK`), 58,465 bytes generated
   - Safe PDF Isolation: Gracefully returned 503 `LIBREOFFICE_NOT_FOUND` when binary is not in PATH
   - Shell Injection Protection: Blocked malicious course code `PPL301"; rm -rf / ; #` with HTTP 400 `VALIDATION_ERROR`
   - Template Upload Validation: Blocked non-docx file upload with HTTP 400 `INVALID_FILE_TYPE`
