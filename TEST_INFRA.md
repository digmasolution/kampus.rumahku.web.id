# E2E Test Infra: Dunia_Kampus (Aplikasi Dosen - RPS)

## Test Philosophy
- Opaque-box, requirement-driven. Independent of implementation internals.
- Derived from `ORIGINAL_REQUEST.md` and user specifications:
  - Dosen (Lecturer) workflow: RPS creation, editing, CPL/CPMK mapping, 16-week matrix, evaluation weights, draft persistence.
  - Export capabilities: DOCX generation and PDF conversion.
  - AI DX & Ecosystem (R2): Context introspection, action execution RPC hub, persistent logging, anti-hallucination diagnostics.
  - Direct VPS Deployment (R3): SOP packaging (`web_build.zip`, no `scp -r`), unzipping, isolated directory `/var/www/kampus-dosen`, Apache reverse proxy, online site accessibility.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Test Architecture
- Test Runner: Node.js runner located at `c:\xampp\htdocs\Aplikasi_Dosen\tests\runner.js`.
- Invocation: `node tests/runner.js` (or via npm script in root/monorepo).
- Output: Pass/fail assertions with clear failure diagnostics and exit code 0 on all pass.
- Test Directory Layout:
  ```
  tests/
  ├── runner.js
  ├── tier1_feature/
  │   ├── test_rps_crud.js
  │   ├── test_export_endpoints.js
  │   ├── test_ai_dx_endpoints.js
  │   ├── test_persistent_logs.js
  │   └── test_vps_scripts.js
  ├── tier2_boundary/
  │   ├── test_empty_boundary.js
  │   ├── test_max_weight_boundary.js
  │   ├── test_invalid_tokens.js
  │   ├── test_injection_sanitization.js
  │   └── test_malformed_inputs.js
  ├── tier3_pairwise/
  │   ├── test_draft_export_flow.js
  │   ├── test_ai_action_rps_sync.js
  │   └── test_deploy_package_contents.js
  └── tier4_workload/
      ├── test_end_to_end_lecturer_journey.js
      └── test_vps_isolation_and_live_http.js
  ```

## Coverage Thresholds
- Tier 1 (Feature Coverage): ≥5 tests per major feature area (RPS CRUD, Template/Export, AI DX Scaffolding, Persistent Logging, VPS Packaging/Deploy).
- Tier 2 (Boundary & Corner Cases): ≥5 tests per boundary class (0% to >100% assessment weights, empty strings, oversized inputs, invalid token authorization, malicious command injection strings).
- Tier 3 (Cross-Feature Combinations): Pairwise tests connecting form inputs -> database -> export stream; AI agent action -> database update -> context reflection; build packaging -> file manifest -> uncompressed layout.
- Tier 4 (Real-World Scenarios): Complete end-to-end lecturer journey (creating full 16-week syllabus, saving draft, exporting DOCX/PDF, querying AI context) and VPS deployment verification.
