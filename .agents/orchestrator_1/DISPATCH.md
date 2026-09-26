## 2026-09-24T07:37:34Z
You are the Project Orchestrator for the project at c:\xampp\htdocs\Aplikasi_Dosen.
Your working directory is: c:\xampp\htdocs\Aplikasi_Dosen\.agents\orchestrator_1
The authoritative request is stored at: c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md

Mission:
Audit and implement improvements on the existing project to meet high-level standards. This is a comprehensive refactor and implementation task, not just a review. Requested team: Full team.

Key Requirements:
1. R1. Architecture and UX Refactoring: Audit and refactor the codebase to ensure UI/UX best practices, seamless functionality across all features, and scalable, smart system design (proper load distribution). Ensure the tech stack is optimized for web-based VPS deployment.
2. R2. AI Developer Experience & Ecosystem: Implement systems that facilitate a seamless workflow between the human developer and AI, including scaffolding for cross-platform AI agent communication and a persistent logging/feedback mechanism that allows AI agents to learn from past mistakes (continuous improvement for debugging and development).
3. R3. Direct VPS Deployment: Implement a seamless deployment script so the application can be directly deployed to the VPS at 38.103.170.236 via SSH public key authentication.
   CRITICAL CONSTRAINTS FOR R3:
   - Adhere to the secure deployment SOP: Do NOT use `scp -r`. You must compress the target folder locally (`web_build.zip`), upload it, and extract it on the server using `unzip -o`. If execution is blocked, use a self-extracting/fixing HTTP script.
   - Do NOT break or overwrite other projects hosted on that VPS. Deploy the application into a specific isolated directory and ensure configurations (like web server config) do not conflict with existing ones.
   - Ensure the live site can be viewed online.

User Rules & SOPs:
- PowerShell BOM: Never use `Set-Content -Encoding UTF8` for source files in Windows/PowerShell. Use native file writing tools or clean BOM.
- PDO safety: Never use the same named parameter more than once in PDO queries (use distinct names like :id_1, :id_2).
- Deadlock prevention: Do NOT pipe Windows binaries inside WSL into Linux tools.

Management Protocol:
- Maintain your own BRIEFING.md and progress.md in your working directory: c:\xampp\htdocs\Aplikasi_Dosen\.agents\orchestrator_1.
- Dispatch tasks to specialists (explorers, implementers, reviewers, etc.) as appropriate.
- When all requirements and acceptance criteria are completed and verified, report completion back to Sentinel (your parent) with full evidence. Do not claim victory without thorough testing. Sentinel will dispatch the independent Victory Auditor.

## 2026-09-24T07:39:39Z
IMPORTANT PROJECT CONTEXT UPDATE:
The user has provided additional context about the project being built:
- Application Name: Dunia_Kampus
- The part currently being built is specifically for the 'Dosen' (Lecturer) role account.
- The main feature being developed is called 'RPS' (Rencana Pembelajaran Semester).
- The domain for deployment is parked at `kampus.rumahku.web.id`.

Ensure that the web server configuration (virtual host / reverse proxy / directory root) and the application layout align with these details, and that the VPS deployment at 38.103.170.236 configures `kampus.rumahku.web.id` in its isolated directory without conflicting with other projects. Both ORIGINAL_REQUEST.md files have been updated with this context.

## 2026-09-24T09:13:55Z
USER FEEDBACK RELAY:
The user is highly satisfied with the rigorous defensive programming approach demonstrated by the challengers and reviewers in Milestone M1. They are eagerly awaiting the commencement of Milestone M2 (AI Developer Experience & Continuous Learning Ecosystem) and Milestone M3 (VPS Deployment). Keep up the outstanding engineering standard!

## 2026-09-24T09:20:34Z
Sentinel Liveness Check: Reviewer M1, Challenger M1, and E2E Test Finalizer (TEST_READY.md) have all completed with unanimous approval. Please update progress.md and dispatch Milestone M2 (AI Developer Experience & Continuous Learning Ecosystem).
