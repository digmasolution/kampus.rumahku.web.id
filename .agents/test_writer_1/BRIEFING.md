# BRIEFING — 2026-09-24T08:02:28Z

## Mission
Build and execute a comprehensive, independent, opaque-box E2E test suite covering Tiers 1-4 for Dunia_Kampus (Aplikasi Dosen - RPS) per ORIGINAL_REQUEST.md, PROJECT.md, and TEST_INFRA.md, culminating in publishing TEST_READY.md.

## 🔒 My Identity
- Archetype: test_writer
- Roles: specialist, qa
- Working directory: c:\xampp\htdocs\Aplikasi_Dosen\.agents\test_writer_1
- Original parent: 44799afd-2d36-4b3b-884a-c0678f464e8a
- Milestone: E2E Testing Track

## 🔒 Key Constraints
- Exclusive write ownership: `tests/**/*`, `TEST_READY.md`, and `.agents/test_writer_1/*`.
- Do NOT modify application source code in `rps-form-app/`.
- Escalate implementation bugs to parent/implementer rather than fixing them.
- DO NOT CHEAT: Opaque-box tests derived from user requirements and specifications. No facade tests.
- PowerShell BOM rule: Never use Set-Content -Encoding UTF8 for source files. Use write_to_file or python.
- .agents/ holds only agent metadata. Never place test code or test artifacts inside .agents/.

## Current Parent
- Conversation ID: 44799afd-2d36-4b3b-884a-c0678f464e8a
- Updated: not yet

## Task Summary
- **What to build**: Unified test runner `tests/runner.js` and all test suites under `tests/tier1_feature/`, `tests/tier2_boundary/`, `tests/tier3_pairwise/`, and `tests/tier4_workload/`.
- **Success criteria**: All test suites executable via `node tests/runner.js`, comprehensive coverage across all 4 tiers, publication of `TEST_READY.md`.
- **Interface contracts**: PROJECT.md § Interface Contracts (Frontend ↔ Backend, AI DX `/api/v1/ai/*`, Deployment Pipeline).
- **Code layout**: PROJECT.md § Code Layout.

## Key Decisions Made
- Use native Node.js (with built-in modules or installed devDependencies like `archiver`/`unzipper`/`prisma`/`node-fetch` if available, or native `http`/`https` / `fetch`) for test runner and tests so they run cleanly in Windows environment without extra friction.
- Tests will connect to backend API server if running, or spin up mock/direct integration or execute command checks as appropriate for offline/online capability.

## Artifact Index
- `tests/runner.js` — Unified test suite orchestrator and reporter
- `tests/tier1_feature/` — Tier 1 Feature Coverage tests (RPS CRUD, exports, AI DX, logs, VPS scripts)
- `tests/tier2_boundary/` — Tier 2 Boundary & Corner cases
- `tests/tier3_pairwise/` — Tier 3 Cross-feature combinations
- `tests/tier4_workload/` — Tier 4 Real-world workload & lecturer journeys
- `c:\xampp\htdocs\Aplikasi_Dosen\TEST_READY.md` — Test suite delivery declaration
- `.agents/test_writer_1/test_plan.md` — Detailed test specifications and design
- `.agents/test_writer_1/handoff.md` — Formal 5-component handoff report

## Loaded Skills
- None specified in dispatch.

## Quality Status
- **Build/test result**: Not started yet
- **Lint status**: N/A
- **Tests added/modified**: In progress
