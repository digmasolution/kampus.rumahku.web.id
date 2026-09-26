## 2026-09-24T09:36:40Z

# Dispatch Assignment: Explorer M2 Remediation (Forensic Audit Remediation Strategy)

## Working Directory
c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_m2_rem_1

## Authoritative User Request
c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md
You MUST read ORIGINAL_REQUEST.md before starting work.

## MANDATORY: Full Forensic Audit Evidence Report
Read `c:\xampp\htdocs\Aplikasi_Dosen\.agents\auditor_m2_1\audit.md` completely.
Read `c:\xampp\htdocs\Aplikasi_Dosen\.agents\auditor_m2_1\handoff.md` completely.

### The Exact Violation to Address:
Location: `rps-form-app/apps/api/src/services/ai.service.ts:501-512`
In `runDoctorDiagnostics()`, Layer 2 (API Response Contracts) returns a static hardcoded `status: 'PASS'` without performing runtime route verification, HTTP probing, or Express router introspection.
Violation: Prohibited Pattern #2 (Facade Implementation).

### Remediation Requirements from Auditor:
1. In `runDoctorDiagnostics()`, replace the static `status: 'PASS'` in Layer 2 with active runtime verification.
   - Dynamically inspect the Express route stack / router layers or perform internal dispatch/pings against each configured endpoint to dynamically confirm that route handlers exist and respond with expected schema contracts.
   - If an endpoint route is missing or fails, `layer2.status` must evaluate to `'FAIL'`, driving overall status to `'DEGRADED'`.
2. In `logger.service.ts`, accept an optional `traceId` in `ErrorLogInput` rather than always generating a disconnected `randomUUID()`, so that error entries preserve cross-telemetry correlation with the originating action `traceId`.

## Mission
1. Investigate `rps-form-app/apps/api/src/services/ai.service.ts`, `server.ts`, and `routes/index.ts`.
2. Design a concrete, genuine implementation fix strategy that completely replaces the hardcoded facade in Layer 2 with dynamic runtime Express route introspection or internal contract probing.
3. Ensure the fix strategy contains NO shortcuts, NO facade patterns, and NO bypasses.
4. Write your recommendations to:
   - `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_m2_rem_1\remediation_plan.md`
   - `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_m2_rem_1\handoff.md`
Report back via send_message when complete.
