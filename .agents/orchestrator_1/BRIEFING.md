# BRIEFING — 2026-09-24T07:38:00Z

## Mission
Audit, refactor architecture & UX, implement AI DX & ecosystem, and direct VPS deployment for Dunia_Kampus (Dosen role, RPS feature, domain: kampus.rumahku.web.id at VPS 38.103.170.236).

## 🔒 My Identity
- Archetype: orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: c:\xampp\htdocs\Aplikasi_Dosen\.agents\orchestrator_1
- Original parent: parent (Sentinel)
- Original parent conversation ID: eec016aa-a4d6-49be-b578-dfc27e4c89bc

## 🔒 My Workflow
- **Pattern**: Project Pattern (Dual Track: Implementation Track + E2E Testing Track)
- **Scope document**: c:\xampp\htdocs\Aplikasi_Dosen\PROJECT.md
1. **Decompose**:
   - Survey phase: Spawn 3 Explorers in parallel to map scope, features, existing architecture, and VPS readiness.
   - Synthesize survey into PROJECT.md § Feature Inventory.
   - Decompose into Milestones (M1: Architecture & UX Refactoring, M2: AI DX & Continuous Learning Ecosystem, M3: VPS Deployment Pipeline & Online Verification, M4: Final End-to-End Acceptance & Hardening).
   - Spawn E2E Testing Orchestrator for requirement-driven opaque-box testing track.
2. **Dispatch & Execute**:
   - Delegate each milestone to sub-orchestrator or iterate (Explorer -> Worker -> Reviewers -> Challengers -> Auditor -> Gate).
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical; never skip auditor)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
4. **Succession**:
   - Threshold: 16 spawns
   - On succession: write soft handoff.md, persist BRIEFING.md and progress.md, kill crons, spawn successor.
- **Work items**:
  1. Survey and Scope Mapping [in-progress]
  2. E2E Testing Track Setup [pending]
  3. Milestone Execution (M1, M2, M3, M4) [pending]
- **Current phase**: 0 (Survey)
- **Current focus**: Survey phase dispatching 3 Explorers

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- NEVER investigate or explore the problem at the code level — dispatch Explorers for technical investigation.
- Use file-editing tools ONLY for metadata/state files (.md) in .agents/ folder.
- Hard audit enforcement: binary veto on integrity violation.
- Adhere to secure deployment SOP: compress locally to web_build.zip, upload, extract with unzip -o, no scp -r.
- Isolate VPS deployment: do not break/overwrite other projects on 38.103.170.236.
- PowerShell BOM: never use Set-Content -Encoding UTF8 for source files.
- PDO safety: distinct named parameters (:id_1, :id_2).
- WSL deadlock prevention: do not pipe Windows binaries into Linux tools.

## Current Parent
- Conversation ID: eec016aa-a4d6-49be-b578-dfc27e4c89bc
- Updated: 2026-09-24T07:38:00Z

## Key Decisions Made
- Selected Project Pattern with Dual Track (Implementation Track + E2E Testing Track).
- Proceeding to Phase 0 Survey mapping current codebase, requirements, and deployment target.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_survey_1 | teamwork_preview_explorer | Architecture & UI/UX Audit | completed | e5324f8e-47c7-4815-a2b4-114cd303f05a |
| explorer_survey_2 | teamwork_preview_explorer | AI DX & Ecosystem Design | completed | bef74504-a80d-41e9-8b74-cbdbd96d0b9d |
| explorer_survey_3 | teamwork_preview_explorer | VPS Deployment & Isolation Survey | completed | 9080ac78-8390-4cc5-8bd3-5761cf6fe872 |
| worker_m1_1 | teamwork_preview_worker | M1: Architecture & UI/UX Refactor | completed | cf5b4c48-5d57-4f43-8592-d89560df92e8 |
| challenger_m1_1 | teamwork_preview_challenger | M1 Challenger 1 (Adversarial) | completed (APPROVE) | cbc3b832-2475-4a87-b8ac-30090d65e37c |
| auditor_m1_2 | teamwork_preview_auditor | M1 Forensic Integrity Auditor | completed (CLEAN) | 19ea0d4a-6324-4ae2-b511-845af3c89427 |
| reviewer_m1_3 | teamwork_preview_reviewer | M1 Reviewer | completed (APPROVE) | 6cd07da5-3080-48d2-8df4-76cdf4f04708 |
| test_writer_2 | teamwork_preview_test_writer | E2E Test Finalizer | completed (TEST_READY) | ee8f4dc5-f5f6-4f84-b158-73783c91870a |
| worker_m2_1 | teamwork_preview_worker | M2: AI DX & Continuous Learning | completed | e2f2c578-3496-46ec-8cdf-1ad0533b051d |
| reviewer_m2_1 | teamwork_preview_reviewer | M2 Reviewer | in-progress | 624db9d9-72e6-4cee-986f-72c1a4015565 |
| challenger_m2_1 | teamwork_preview_challenger | M2 Challenger (Adversarial) | in-progress | f38eaf3d-c6ce-4c7c-8f9e-dd4832c9d59d |
| auditor_m2_1 | teamwork_preview_auditor | M2 Forensic Integrity Auditor | completed (INTEGRITY VIOLATION) | 861fdd50-2896-47fb-9d36-deb5b2c31e24 |
| explorer_m2_rem_1 | teamwork_preview_explorer | M2 Remediation Explorer | in-progress | 70aaa641-4ec3-4ec7-b074-2b76fe2ad760 |

## Succession Status
- Succession required: no (active orchestrator mode, max agent limit 128)
- Spawn count: 18 / 128
- Pending subagents: 70aaa641-4ec3-4ec7-b074-2b76fe2ad760
- Predecessor: none
- Successor: none

## Active Timers
- Heartbeat cron: 44799afd-2d36-4b3b-884a-c0678f464e8a/task-332 (every 10m)
- Safety timer: none

## Artifact Index
- c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md — Authoritative User Request
- c:\xampp\htdocs\Aplikasi_Dosen\.agents\orchestrator_1\DISPATCH.md — Incoming Dispatch Record
- c:\xampp\htdocs\Aplikasi_Dosen\.agents\orchestrator_1\BRIEFING.md — Persistent Working Memory
- c:\xampp\htdocs\Aplikasi_Dosen\.agents\orchestrator_1\progress.md — Liveness & Progress Status
