# Dispatch Assignment: Challenger 1 (M1 Adversarial Verification)

## Working Directory
c:\xampp\htdocs\Aplikasi_Dosen\.agents\challenger_m1_1

## Authoritative User Request
c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md
You MUST read ORIGINAL_REQUEST.md before starting work.

## Reference Documents
- `c:\xampp\htdocs\Aplikasi_Dosen\PROJECT.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m1_1\changes.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m1_1\handoff.md`

## Mission
Adversarially challenge and stress-test the Milestone 1 implementation:
1. Run builds (`npm run build -w apps/web` and `npm run build -w apps/api`) and check for hidden build regressions or type assertions.
2. Stress test input validation and edge cases:
   - Command injection attempts in PDF export filenames/courseCode (`MKK209; rm -rf /`, `MKK209 & whoami`, `MKK209"$(calc.exe)"`). Verify they are rejected or safely escaped.
   - Malformed file uploads to `/api/templates/upload` (non-docx files, empty files, zip bombs, files without `word/document.xml`). Verify they are rejected with proper HTTP 400 errors.
   - Large or corrupted payload submissions to `/api/rps`.
3. Check UI/UX responsiveness, accessibility, and error handling.
4. Report whether the implementation is robust against adversarial inputs.
5. State your verdict: `APPROVE` or `REJECT` with empirical test evidence.

Write your report to:
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\challenger_m1_1\challenge.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\challenger_m1_1\handoff.md`


## 2026-09-24T08:20:36Z
You are Challenger 1 for Milestone 1.
Your working directory is: c:\xampp\htdocs\Aplikasi_Dosen\.agents\challenger_m1_1
Read your assignment in: c:\xampp\htdocs\Aplikasi_Dosen\.agents\challenger_m1_1\DISPATCH.md
The authoritative user request is at: c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md

You MUST read ORIGINAL_REQUEST.md before starting work.

Adversarially challenge and stress-test M1:
1. Test command injection attacks in PDF export courseCode (e.g. `MKK209; whoami`, `MKK209"$(calc)"`).
2. Test malformed file uploads to /api/templates/upload (non-docx, corrupt zip, empty files).
3. Test edge case payloads to /api/rps.
4. Verify build commands and UI responsiveness.
5. Issue verdict: APPROVE or REJECT with test evidence.

Write your report to:
- c:\xampp\htdocs\Aplikasi_Dosen\.agents\challenger_m1_1\challenge.md
- c:\xampp\htdocs\Aplikasi_Dosen\.agents\challenger_m1_1\handoff.md
Send a completion message back when finished.
