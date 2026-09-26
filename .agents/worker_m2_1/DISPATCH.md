# Dispatch Assignment: Worker M2 (AI Developer Experience & Continuous Learning Ecosystem)

## Working Directory
c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m2_1

## Authoritative User Request
c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md
You MUST read ORIGINAL_REQUEST.md before starting work.

## Reference Documents
- `c:\xampp\htdocs\Aplikasi_Dosen\PROJECT.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\TEST_INFRA.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_2\analysis.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_2\handoff.md`

## Write Ownership Boundaries
You have exclusive write ownership of:
- `rps-form-app/prisma/schema.prisma`
- `rps-form-app/apps/api/src/routes/ai.routes.ts`
- `rps-form-app/apps/api/src/controllers/ai.controller.ts`
- `rps-form-app/apps/api/src/services/ai.service.ts`
- `rps-form-app/apps/api/src/services/logger.service.ts`
- `rps-form-app/apps/api/src/services/learning.service.ts`
- `rps-form-app/apps/api/src/middleware/agentAuth.ts`
- `rps-form-app/apps/api/src/routes/index.ts`
- `rps-form-app/apps/api/src/server.ts`
- `rps-form-app/storage/logs/`
Do NOT modify files in `apps/web/` or `tests/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks
1. **Prisma Schema Extension & Database Migration**:
   - Add the 5 AI ecosystem models to `rps-form-app/prisma/schema.prisma` as specified in `analysis.md`:
     `AiAgent`, `AiInteractionLog`, `AiErrorLog`, `AiFeedback`, `AiLearnedRule`.
   - Run `npx prisma db push` (or `npx prisma migrate dev`) and `npx prisma generate` in `rps-form-app/` to update the local SQLite database (`dev.db`) and Prisma Client.
2. **AI Scaffolding & Routing (`/api/v1/ai/*`)**:
   - Implement `agentAuth` middleware supporting `X-Agent-Key` (with support for default dev token `default-ai-agent-key` and env tokens).
   - Implement routes:
     - `GET /api/v1/ai/context`: Introspection of system environment, active template tags, schema version, and active rules.
     - `GET /api/v1/ai/actions/catalog`: JSON schema definitions for external tool calling (`rps.create`, `rps.update`, `rps.get`, `rps.export_docx`, `system.run_doctor`).
     - `POST /api/v1/ai/actions/execute`: RPC hub executing actions and returning `{ success, result, traceId }`.
     - `GET /api/v1/ai/learning/rules`: Returns learned rules, error patterns, and remediation guidelines.
     - `POST /api/v1/ai/learning/rules`: Register new learned rules.
     - `POST /api/v1/ai/learning/feedback`: Submit feedback and corrections for AI interactions.
3. **Dual-Layer Persistence**:
   - Queryable database tables in SQLite (`AiInteractionLog`, `AiErrorLog`, `AiFeedback`, `AiLearnedRule`).
   - Append-only filesystem JSONL logs in `storage/logs/ai-agent.jsonl` and `storage/logs/ai-errors.jsonl`.
4. **Anti-Hallucination Framework (3-Layer Verification)**:
   - Implement the `system.run_doctor` diagnostic action verifying: (1) physical SQLite DB records, (2) API response contracts, (3) model schemas.
5. **Knowledge Seeding**:
   - Seed initial rules into `AiLearnedRule` (TS strict rules, Word XML layout rules, 100% weight rule, PDO safety rule).
6. **Verification**:
   - Build `apps/api`: `npm run build -w apps/api` must compile cleanly (exit code 0).
   - Run E2E tests: `node tests/runner.js` to verify Tier 1, Tier 2, and Tier 3 tests pass for AI endpoints!

Write your changes and verification report to:
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m2_1\changes.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m2_1\handoff.md`
Report back via send_message when complete.
