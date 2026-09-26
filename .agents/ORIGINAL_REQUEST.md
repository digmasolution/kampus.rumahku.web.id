# Original User Request

## Initial Request — 2026-09-24T07:36:44Z

Audit and implement improvements on the existing project to meet high-level standards. This is a comprehensive refactor and implementation task, not just a review.
Requested team: Full team

Working directory: c:\xampp\htdocs\Aplikasi_Dosen
Integrity mode: development

## Requirements

### R1. Architecture and UX Refactoring
Audit and refactor the current codebase to ensure UI/UX best practices, seamless functionality across all features, and a scalable, smart system design (proper load distribution). Ensure the tech stack is optimized for web-based VPS deployment.

### R2. AI Developer Experience & Ecosystem
Implement systems that facilitate a seamless workflow between the human developer and AI. This includes scaffolding for cross-platform AI agent communication and a persistent logging/feedback mechanism that allows AI agents to learn from past mistakes (continuous improvement for debugging and development).

### R3. Direct VPS Deployment
Implement a seamless deployment script so the application can be directly deployed to the VPS at `38.103.170.236` via SSH public key authentication. You MUST adhere to the secure deployment SOP: Do not use `scp -r`. You must compress the target folder locally (`web_build.zip`), upload it, and extract it on the server using `unzip -o`. If execution is blocked, use a self-extracting/fixing HTTP script.

## Acceptance Criteria

### Agent-as-Judge Evaluation
An independent agent must evaluate the final state of the repository against the following rubric and confirm all points pass:
- [ ] **UI/UX & Functionality**: The application runs without errors and adheres to standard web usability guidelines.
- [ ] **Architecture**: The codebase is logically separated (e.g., MVC or similar pattern) demonstrating readiness for scalable VPS deployment.
- [ ] **AI Integration**: The repository contains clear integration points (e.g., API endpoints, message queues, or context files) for cross-platform agent communication.
- [ ] **Continuous Learning**: A verifiable mechanism (e.g., specific log files, feedback database tables, or memory modules) exists to store and retrieve AI interaction history and error logs.
- [ ] **Deployment**: A deployment script is present that successfully packages the application into a zip file, uploads it to `38.103.170.236` via SSH, and extracts it, allowing the user to view the live site online.

## Follow-up — 2026-09-24T07:36:50Z

The user has added an important constraint regarding R3 (VPS Deployment). When deploying to `38.103.170.236`, you MUST ensure that you do not break or overwrite other projects hosted on that VPS. Deploy the application into a specific isolated directory and ensure configurations (like web server config) do not conflict with existing ones.

## Follow-up — 2026-09-24T07:38:57Z

The user has provided additional context about the project being built:
- Application Name: Dunia_Kampus
- The part currently being built is specifically for the 'Dosen' (Lecturer) role account.
- The main feature being developed is called 'RPS'.
- The domain for deployment is parked at `kampus.rumahku.web.id`.

Please pass this context to the Project Orchestrator to ensure the deployment configuration (web server) and the application layout align with these details.

## Follow-up — 2026-09-24T11:45:35Z

The user has provided an architectural directive for agent coordination and context management:
1. Ensure there is a mechanism for logging 'issue-to-technical fix' or 'user request-to-issue-to-fix' WITH summaries. The goal is context compression: preventing agents from reading too much irrelevant history (a concise summary view/log for agents to read quickly).
2. Create an `agents.md` file at the root of the project to serve as a 'central command' index. This file should use an indexing method to map the app's structure, routes, and core concepts so agents do not suffer from 'lost in the middle' syndrome when reading context.

## Follow-up — 2026-09-24T11:48:24Z

Additional critical directives from the user to enforce immediately:
1. Prevent "God Code": Strictly avoid monolithic classes, functions, or files that handle too many responsibilities. Enforce strict single-responsibility principles (SRP) and modularity.
2. Prevent Backdoors & Security Debt: Absolutely no hidden bypasses, backdoor methods (e.g., hardcoded admin tokens, 'skip_auth' flags for testing), or shortcuts that could mature into security debt.
These rules must be appended to `agents.md` as mandatory 'Golden Rules' for all current and future AI agents working on this repository, and all auditing agents must check against these principles.

## Follow-up — 2026-09-24T12:03:49Z

CRITICAL REMINDER from the user regarding Milestone M3 VPS Deployment:
The user explicitly reiterates that their VPS (38.103.170.236) already hosts several other projects. You MUST double-check and ensure absolutely zero interference with existing projects. 
- Ensure isolation in `/var/www/kampus-dosen`.
- Ensure Apache virtual host configs (`kampus.conf`) DO NOT overwrite or conflict with other existing `.conf` files.
- Ensure the extraction process (`unzip -o`) ONLY targets the isolated directory and DOES NOT touch the web root or other tenant directories.




