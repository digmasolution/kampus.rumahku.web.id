# Adversarial Challenge Report: Milestone 1 (M1)

**Auditor / Challenger:** Challenger 1  
**Target:** Milestone 1 (Architecture, Security & UI/UX Refactoring)  
**Date:** 2026-09-24  
**Verdict:** **APPROVE**  
**Overall Risk Assessment:** **LOW**

---

## 1. Executive Summary

Milestone 1 implementation in `rps-form-app` was subjected to rigorous empirical adversarial testing covering:
1. Command injection attempts across `courseCode` via REST APIs and document export mechanisms.
2. Malformed, truncated, oversized, and non-DOCX file uploads to `/api/templates/upload`.
3. Boundary, malformed, and injection payloads to `/api/rps`.
4. Monorepo TypeScript builds and responsive UI implementation.

A total of **39 independent adversarial test vectors** were executed against the compiled backend API and storage layer via `tests/adversarial/challenger_m1_adversarial.js`:
- **Passed:** 39 / 39 (100%)
- **Failed:** 0 / 39 (0%)
- **Crashes / Hangs:** 0

The codebase demonstrates solid defense-in-depth: input sanitization via Zod regex whitelists, process isolation with `execFile({ shell: false })`, file structure validation verifying ZIP entries (`word/document.xml`), and reactive state management in the frontend.

---

## 2. Challenge Findings & Stress-Testing

### Challenge 1: Command Injection Attacks in `courseCode` and Document Export
- **Assumption Challenged:** The application might rely solely on frontend validation, pass unsanitized input to child processes, or allow shell metacharacter expansion during DOCX / PDF export.
- **Attack Scenarios Tested:**
  1. `MKK209; whoami` (Semicolon command chaining)
  2. `MKK209"$(calc.exe)"` (Subshell command substitution)
  3. `MKK209 & whoami` (Windows single ampersand execution)
  4. `MKK209 && calc.exe` (Windows double ampersand execution)
  5. `MKK209 | dir` (Pipe redirection)
  6. `MKK209\`whoami\`` (Backtick command execution)
  7. `MKK209\nwhoami` (Newline command separation)
  8. `MKK209 > pwned.txt` (File redirection)
  9. `PPL301"; rm -rf / ; #` (Unix destructive shell interpolation)
  10. `PUT /api/rps/:id` with malicious `courseCode` update
  11. Stealth injection: injecting malicious code into nested JSON `data.courseCode` or `data.kodeMataKuliah` while leaving top-level `courseCode` empty.
- **Empirical Results:**
  - In direct `POST /api/rps` and `PUT /api/rps/:id`, all 9 malicious vectors were immediately rejected with **HTTP 400 Bad Request** (`code: "VALIDATION_ERROR"`), blocked by Zod's `/^[A-Za-z0-9_-]*$/` whitelist.
  - In the stealth injection scenario (nested data fields), `docxService.generateDocx()` strictly sanitized the output filename using `.replace(/[^a-zA-Z0-9_-]/g, '_')`, producing `RPS_INJECT__whoami___calc_exe_<timestamp>.docx`. No shell special characters reached the file system.
  - In `pdfService.convertToPdf()`, conversion executes via `execFile(binary, args, { shell: false })`. Arguments are passed directly to OS kernel exec vectors without shell interpretation. When LibreOffice is missing in PATH, the server gracefully returns **HTTP 503 Service Unavailable** (`code: "LIBREOFFICE_NOT_FOUND"`) instead of crashing.
- **Risk Level:** **LOW** (Mitigated).

---

### Challenge 2: Malformed File Uploads to `/api/templates/upload`
- **Assumption Challenged:** An attacker could upload an executable, a PHP script, an empty file, or a corrupted ZIP archive to overwrite the active master template `templates/processed/rps-template-processed.docx` or induce denial-of-service.
- **Attack Scenarios Tested:**
  1. Executable file (`exploit.exe` with PE magic bytes `MZ`)
  2. PHP web shell script (`shell.php` with `<?php system(...) ?>`)
  3. PDF document (`document.pdf` with `%PDF-1.4`)
  4. Zero-byte empty file with `.docx` extension (`empty.docx`, size 0)
  5. Corrupted binary file / random garbage bytes (`corrupt.docx`)
  6. Valid ZIP archive missing internal `word/document.xml` (`fake_docx.docx`)
  7. Empty multipart request without file attachment
  8. Valid DOCX upload to test automated backup and activation mechanism
- **Empirical Results:**
  - Non-DOCX files (`.exe`, `.php`, `.pdf`) were rejected with **HTTP 400** (`code: "INVALID_FILE_TYPE"`).
  - 0-byte file was rejected with **HTTP 400** (`code: "CORRUPTED_TEMPLATE"`).
  - Corrupt binary bytes were rejected with **HTTP 400** (`code: "MALFORMED_TEMPLATE"`).
  - Valid ZIP archive lacking `word/document.xml` was rejected with **HTTP 400** (`code: "CORRUPTED_TEMPLATE"`).
  - Missing file attachment was rejected with **HTTP 400** (`code: "FILE_MISSING"`).
  - Upload of valid DOCX succeeded with **HTTP 200** and generated an automated backup `templates/backups/rps-template-processed.backup_<timestamp>.docx`.
  - In all rejection cases, temporary files in `storage/uploads/` were immediately unlinked from disk.
- **Risk Level:** **LOW** (Mitigated).

---

### Challenge 3: Edge-Case & Boundary Payloads to `/api/rps`
- **Assumption Challenged:** Malformed JSON, empty bodies, out-of-range integer values, SQL injection strings in search, or massive payloads could trigger unhandled exceptions or crash the Node process.
- **Attack Scenarios Tested:**
  1. Empty JSON object `{}` in `POST /api/rps`
  2. Empty title `""` and whitespace-only title `"   "`
  3. Non-existent enum for status (`"ILLEGAL_STATUS_HACKED"`)
  4. Negative completionPercentage (`-15`)
  5. Excessive completionPercentage (`150`)
  6. Non-integer completionPercentage (`75.5`)
  7. Malformed raw JSON syntax (`{"title": "Broken Json...`)
  8. SQL injection in search parameter (`search=' OR '1'='1`)
  9. SQL injection dropping tables (`search='; DROP TABLE RpsDocument;--`)
  10. Non-existent IDs across GET, PUT, DELETE, and export endpoints
  11. Massive payload: 100 CPL entries, 32 weekly plan entries, 500x repeated syllabus text
- **Empirical Results:**
  - Empty body `{}` handled cleanly: returned **HTTP 201 Created** with default title `"Draft RPS"` and status `"DRAFT"`.
  - Empty and whitespace titles rejected with **HTTP 400** (`code: "VALIDATION_ERROR"`).
  - Invalid status enum and out-of-range completion percentages rejected with **HTTP 400** (`code: "VALIDATION_ERROR"`).
  - Malformed JSON returned **HTTP 400 Bad Request** (`type: "entity.parse.failed"`).
  - SQL injection search queries were safely handled by Prisma's parameterized queries without SQL syntax errors or data exfiltration. The database remained intact.
  - Non-existent IDs reliably returned **HTTP 404** (`code: "NOT_FOUND"`).
  - Massive payload was persisted within 6ms and rendered a 58.4KB DOCX document within 77ms without memory spikes.
- **Risk Level:** **LOW** (Mitigated).

---

### Challenge 4: Build Integrity & UI/UX Responsiveness
- **Build Commands:**
  - `npm run build -w apps/api`: **PASSED** (Exit code: 0).
  - `npm run build -w apps/web`: **PASSED** (Exit code: 0).
  - `npm run build`: **PASSED** (Exit code: 0, generated `dist/` in both workspaces).
- **UI Responsiveness & Ergonomics:**
  - `App.tsx`: Features responsive desktop navigation (`hidden md:block`) alongside a slide-over mobile drawer with backdrop overlay (`fixed inset-0 bg-black/50 z-40 md:hidden`), accessible toggle button (`aria-label="Buka menu navigasi"`), and automatic drawer dismissal on route selection.
  - `TemplateSettingsMockup.tsx`: Single sidebar layout (duplicate nested sidebar defect resolved). Includes pre-upload client-side extension validation, animated progress spinner during upload, and prominent dismissible notification banners (`bg-green-50` / `bg-red-50`).
  - `WizardMockup.tsx`: Controlled reactive inputs bound to Zustand store across all 9 steps. Add/Remove row handlers for CPL, 16-week matrix, and penilaian are fully functional with live percentage totals. "Simpan Draft" persists state to `/api/rps` (POST/PUT) with real-time timestamped status notification.
  - `DashboardMockup.tsx`: Wired to `rpsApi.getRpsList()` with search query and status filters; provides direct action links to continue drafting in the wizard.
- **Risk Level:** **LOW** (Mitigated).

---

## 3. Stress Test Results Summary Matrix

| # | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| 1 | `POST /api/rps` with `courseCode: 'MKK209; whoami'` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 2 | `POST /api/rps` with `courseCode: 'MKK209"$(calc.exe)"'` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 3 | `POST /api/rps` with `courseCode: 'MKK209 & whoami'` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 4 | `POST /api/rps` with `courseCode: 'MKK209 && calc.exe'` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 5 | `POST /api/rps` with `courseCode: 'MKK209 \| dir'` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 6 | `POST /api/rps` with `courseCode: 'MKK209\`whoami\`'` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 7 | `POST /api/rps` with `courseCode: "MKK209\nwhoami"` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 8 | `POST /api/rps` with `courseCode: 'MKK209 > pwned.txt'` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 9 | `POST /api/rps` with `courseCode: 'PPL301"; rm -rf / ; #'"` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 10 | `PUT /api/rps/:id` with malicious `courseCode` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 11 | DOCX export with metacharacters in data object | Sanitized filename (`RPS_...`) | Sanitized filename (`RPS_INJECT__whoami...`) | **PASS** |
| 12 | PDF export with metacharacters in data object | Safe isolation / 503 fallback | HTTP 503 LIBREOFFICE_NOT_FOUND (no exec) | **PASS** |
| 13 | Upload `exploit.exe` to `/api/templates/upload` | HTTP 400 INVALID_FILE_TYPE | HTTP 400 INVALID_FILE_TYPE | **PASS** |
| 14 | Upload `shell.php` to `/api/templates/upload` | HTTP 400 INVALID_FILE_TYPE | HTTP 400 INVALID_FILE_TYPE | **PASS** |
| 15 | Upload `document.pdf` to `/api/templates/upload` | HTTP 400 INVALID_FILE_TYPE | HTTP 400 INVALID_FILE_TYPE | **PASS** |
| 16 | Upload 0-byte `empty.docx` to `/api/templates/upload` | HTTP 400 CORRUPTED_TEMPLATE | HTTP 400 CORRUPTED_TEMPLATE | **PASS** |
| 17 | Upload corrupted binary `corrupt.docx` | HTTP 400 MALFORMED_TEMPLATE | HTTP 400 MALFORMED_TEMPLATE | **PASS** |
| 18 | Upload ZIP without `word/document.xml` | HTTP 400 CORRUPTED_TEMPLATE | HTTP 400 CORRUPTED_TEMPLATE | **PASS** |
| 19 | Upload with missing file attachment | HTTP 400 FILE_MISSING | HTTP 400 FILE_MISSING | **PASS** |
| 20 | Upload valid DOCX template | HTTP 200 & backup generated | HTTP 200 & backup verified on disk | **PASS** |
| 21 | `POST /api/rps` with empty body `{}` | HTTP 201 DRAFT defaults | HTTP 201 DRAFT, title "Draft RPS" | **PASS** |
| 22 | `POST /api/rps` with empty title `""` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 23 | `POST /api/rps` with whitespace title `"   "` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 24 | `POST /api/rps` with status `"ILLEGAL_STATUS"` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 25 | `POST /api/rps` with `completionPercentage: -15` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 26 | `POST /api/rps` with `completionPercentage: 150` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 27 | `POST /api/rps` with `completionPercentage: 75.5` | HTTP 400 VALIDATION_ERROR | HTTP 400 VALIDATION_ERROR | **PASS** |
| 28 | `POST /api/rps` with unclosed malformed JSON | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| 29 | `GET /api/rps?search=' OR '1'='1` | HTTP 200 safe query | HTTP 200 safe query (0 matches) | **PASS** |
| 30 | `GET /api/rps?search='; DROP TABLE RpsDocument;--` | HTTP 200 safe query | HTTP 200 safe query (table intact) | **PASS** |
| 31 | `GET /api/rps/:id` with non-existent ID | HTTP 404 NOT_FOUND | HTTP 404 NOT_FOUND | **PASS** |
| 32 | `PUT /api/rps/:id` with non-existent ID | HTTP 404 NOT_FOUND | HTTP 404 NOT_FOUND | **PASS** |
| 33 | `DELETE /api/rps/:id` with non-existent ID | HTTP 404 NOT_FOUND | HTTP 404 NOT_FOUND | **PASS** |
| 34 | `GET /api/rps/:id/export/docx` non-existent ID | HTTP 404 NOT_FOUND | HTTP 404 NOT_FOUND | **PASS** |
| 35 | `GET /api/rps/:id/export/pdf` non-existent ID | HTTP 404 NOT_FOUND | HTTP 404 NOT_FOUND | **PASS** |
| 36 | Massive payload (100 CPL, 32 weeks, 500x syllabus) | HTTP 201 Created | HTTP 201 Created (6ms) | **PASS** |
| 37 | Massive DOCX export generation | HTTP 200 binary stream | HTTP 200 binary (58,460 bytes in 77ms) | **PASS** |
| 38 | `npm run build -w apps/api` | Clean exit 0 | Clean exit 0 | **PASS** |
| 39 | `npm run build -w apps/web` | Clean exit 0 | Clean exit 0 | **PASS** |

---

## 4. Unchallenged Areas

- **VPS Deployment & Isolation (M3)**: Remote VPS deployment at `38.103.170.236` and Apache reverse proxy config are designated for Milestone 3.
- **AI Agent Introspection & Telemetry (M2)**: `/api/v1/ai/*` routes and Prisma AI tables are designated for Milestone 2.

---

## 5. Verdict & Recommendation

**Verdict: APPROVE**

The Milestone 1 work product meets all security, stability, architecture, and UI/UX criteria required by `PROJECT.md` and `DISPATCH.md`. It has successfully withstood adversarial attack vectors and is fully ready to serve as the foundation for Milestone 2.
