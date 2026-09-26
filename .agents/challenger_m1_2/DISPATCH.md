# Dispatch Assignment: Challenger 2 (M1 Adversarial Verification)

## Working Directory
c:\xampp\htdocs\Aplikasi_Dosen\.agents\challenger_m1_2

## Authoritative User Request
c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md
You MUST read ORIGINAL_REQUEST.md before starting work.

## Reference Documents
- `c:\xampp\htdocs\Aplikasi_Dosen\PROJECT.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m1_1\changes.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m1_1\handoff.md`

## Mission
Adversarially challenge and stress-test the Milestone 1 implementation:
1. Test data integrity and edge cases in the reactive Zustand store (`useRpsStore.ts`) and backend persistence:
   - What happens when saving draft with empty fields vs partially completed fields?
   - Check evaluation weight calculations (total < 100%, total > 100%, negative weights).
   - Test CPL and 16-week matrix boundary conditions (e.g. 0 weeks, 16 weeks, missing subCPMK).
2. Test DOCX generation with boundary data (special characters in lecturer names, unicode, emojis, multiline text).
3. Test CORS policy with unpermitted origins (should be blocked) vs permitted origins.
4. Verify mobile drawer behavior and settings page layout.
5. State your verdict: `APPROVE` or `REJECT` with empirical test evidence.

Write your report to:
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\challenger_m1_2\challenge.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\challenger_m1_2\handoff.md`
Report back via send_message when complete.

## 2026-09-24T08:20:36Z
You are Challenger 2 for Milestone 1.
Your working directory is: c:\xampp\htdocs\Aplikasi_Dosen\.agents\challenger_m1_2
Read your assignment in: c:\xampp\htdocs\Aplikasi_Dosen\.agents\challenger_m1_2\DISPATCH.md
The authoritative user request is at: c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md

Adversarially challenge and stress-test M1:
1. Test data integrity in reactive Zustand store and backend persistence (partial drafts, empty fields).
2. Test evaluation weight calculation boundaries (<100%, >100%, negative).
3. Test DOCX generation with boundary data (special characters, unicode, multiline).
4. Test CORS policy rejection of untrusted origins.
5. Issue verdict: APPROVE or REJECT with test evidence.
