# Dispatch: Project Orchestrator Successor (Gen 2)

## Working Directory
c:\xampp\htdocs\Aplikasi_Dosen\.agents\orchestrator_1_gen2

## Predecessor Handoff
Read `c:\xampp\htdocs\Aplikasi_Dosen\.agents\orchestrator_1\handoff.md`
Read `c:\xampp\htdocs\Aplikasi_Dosen\.agents\orchestrator_1\BRIEFING.md`
Read `c:\xampp\htdocs\Aplikasi_Dosen\.agents\orchestrator_1\GATE_STATUS.md`
Read `c:\xampp\htdocs\Aplikasi_Dosen\.agents\orchestrator_1\progress.md`

## Authoritative User Request
`c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md`

## Scope Document
`c:\xampp\htdocs\Aplikasi_Dosen\PROJECT.md`

## Parent Sentinel
Conversation ID: `eec016aa-a4d6-49be-b578-dfc27e4c89bc`
All communication and final victory reporting must be sent to this ID via `send_message`.

## 2026-09-24T11:46:02Z
NEW ARCHITECTURAL DIRECTIVE FROM USER (Appended to ORIGINAL_REQUEST.md):
1. **Context Compression & Issue-to-Fix Logging**:
   - Ensure there is a concise, compressed summary mechanism for logging 'issue-to-technical fix' / 'user request-to-issue-to-fix' (e.g., a summarized view/log or API endpoint) so future AI agents do not have to read bloated histories or get lost in irrelevant logs.
2. **`agents.md` Central Command Index**:
   - Create/update an `agents.md` file at the root of the project (`c:\xampp\htdocs\Aplikasi_Dosen\agents.md`) to serve as a 'central command' index.
   - It must use a structured indexing method mapping the application structure, key routes, core domain concepts, and agent tools/protocols to prevent 'lost in the middle' syndrome for incoming agents.

Incorporate these two items into Milestone M2 / M3 deliverables and ensure `agents.md` is authored and indexed thoroughly.

## 2026-09-24T11:48:48Z
CRITICAL DIRECTIVE UPDATE FROM USER (Appended to ORIGINAL_REQUEST.md):
1. **Prevent "God Code"**: Strictly avoid monolithic classes, functions, or files that handle too many responsibilities. Enforce strict single-responsibility principles (SRP) and modularity across all modules.
2. **Prevent Backdoors & Security Debt**: Absolutely no hidden bypasses, backdoor methods (e.g. hardcoded admin tokens, 'skip_auth' flags for testing), or shortcuts that could mature into security debt.

MANDATORY ACTION:
Append these two rules to the newly created `agents.md` as mandatory 'Golden Rules' for all current and future AI agents working on this repository, and ensure all auditing agents explicitly check against these principles.

## 2026-09-24T12:04:42Z
CRITICAL MANDATORY INSTRUCTION FOR MILESTONE M3 VPS DEPLOYMENT:
The user explicitly reiterates that VPS `38.103.170.236` hosts multiple existing production projects. You and worker_m3_1 MUST guarantee ABSOLUTELY ZERO INTERFERENCE with any other project on the server:
1. Strict Isolation: Deploy ONLY into `/var/www/kampus-dosen` (with releases/ and shared/ subdirectories).
2. Web Server Non-Interference: Ensure Apache virtual host configuration `kampus.conf` has ServerName `kampus.rumahku.web.id` and reverse-proxies exclusively to dedicated Node port 3005. DO NOT overwrite or touch existing `.conf` files (`syukran.conf`, `arabiq.conf`, `uncm.conf`, `000-default.conf`).
3. Extraction Boundary: The `unzip -o web_build.zip` command MUST be executed strictly inside the target `/var/www/kampus-dosen` directory. NEVER extract in `/var/www` or `/root`.
4. Document Root: Point Apache DocumentRoot exclusively to `/var/www/kampus-dosen/current/apps/web/dist` (or equivalent inside the isolated directory).

Confirm that worker_m3_1, the deployment scripts (`deploy.ps1`, `deploy.sh`, `fix_server.php`), and the deployment reviewers/auditors explicitly enforce these four isolation requirements.



