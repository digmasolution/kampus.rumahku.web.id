## 2026-09-24T11:57:11Z
You are Worker M3 (VPS Deployment, Packaging & Central Command Index Worker).
Your assigned working directory is: c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m3_1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Context Documents & Authoritative Requirements:
1. User requirements: c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md
2. Project roadmap: c:\xampp\htdocs\Aplikasi_Dosen\PROJECT.md
3. M2 Gate Result: M2 passed all gates cleanly (see c:\xampp\htdocs\Aplikasi_Dosen\.agents\orchestrator_1_gen2\GATE_STATUS.md)

User Global Rules & Deployment SOP:
- HINDARI `scp -r`! Dilarang meng-upload folder mentah.
- WAJIB KOMPRESI: Kompres dulu folder target (`web_build.zip`) di lokal, upload, lalu ekstrak di server menggunakan `unzip -o`.
- ISOLASI VPS: Deploy HANYA ke direktori terisolasi `/var/www/kampus-dosen/`. JANGAN menimpa atau mengganggu project lain di VPS `38.103.170.236` (seperti syukran-laravel, arabiq, uncm).
- AUTO-FIX SCRIPT: Sediakan `fix_server.php` di project root untuk 1-klik repair/self-extracting via HTTP jika diperlukan.
- Domain target: `kampus.rumahku.web.id` (Apache vhost reverse proxying `/api` ke Node.js port 3005, serving static React app from `/var/www/kampus-dosen/current/apps/web/dist`).
- Golden Rules:
  1. Prevent "God Code": Strict single-responsibility principle (SRP) and modularity.
  2. Prevent Backdoors & Security Debt: Zero hardcoded bypasses or test backdoor tokens.

Detailed Tasks for Milestone M3:
1. Context Compression & Issue-to-Fix Logging:
   - In `rps-form-app/apps/api/src`: Add a concise summary mechanism for 'issue-to-technical fix' / 'user request-to-issue-to-fix'.
   - Add endpoint `GET /api/v1/ai/learning/summaries` and `POST /api/v1/ai/learning/issue-fix`.
   - Maintain a concise, compressed summary log at `storage/logs/issue-fix-summary.jsonl` and human/agent-readable `storage/logs/ISSUE_FIX_SUMMARY.md` documenting key historical issues and fixes (including the M1 TS/PDF fixes and M2 router introspection fix).
2. `agents.md` Central Command Index:
   - Create `c:\xampp\htdocs\Aplikasi_Dosen\agents.md` at project root.
   - Must include:
     - Mandatory Golden Rules (Prevent God Code, Prevent Backdoors & Security Debt).
     - Global Project Overview (Dunia_Kampus - Aplikasi Dosen RPS).
     - Directory Map & Monorepo Structure.
     - Key API Route Catalog & Contracts.
     - Core Domain Concepts & RPS Schemas.
     - Agent Introspection Tools & RPC Protocol (`/api/v1/ai/*`).
     - VPS Infrastructure & Deployment Topology (`38.103.170.236`, `/var/www/kampus-dosen`).
     - Quick Reference index preventing "lost in the middle" syndrome.
3. Update `PROJECT.md`:
   - In `## Feature Inventory`: Add Feature 25 (Context Compression & Issue-to-Fix Logging, M2) and Feature 26 (`agents.md` Central Command Index, M3).
   - In `## Milestones`: Update M2 Status to `DONE` and M3 Status to `IN_PROGRESS`.
4. Production Build & Packaging:
   - Build web: `npm --prefix rps-form-app/apps/web run build`
   - Build api: `npm --prefix rps-form-app/apps/api run build`
   - Package production bundle into `web_build.zip` at project root (containing `apps/web/dist`, `apps/api/dist`, `apps/api/package.json`, root `package.json`, `prisma/schema.prisma`, `storage/`, and deployment configs).
5. Deployment Scripts & Configurations:
   - `deploy.ps1`: Automated PowerShell deployment script with parameters for host (`38.103.170.236`), user (`root`), domain (`kampus.rumahku.web.id`), zip packaging, scp upload of zip, remote unzip, service reload, and curl verification.
   - `deploy.sh`: Automated Bash deployment script.
   - `fix_server.php`: Self-extracting / fixing HTTP recovery script.
   - Apache virtual host: `kampus.conf` configured for `kampus.rumahku.web.id` proxying port 3005.
   - Systemd unit: `kampus-api.service`.
6. Live VPS Execution & Verification:
   - Execute deployment to VPS `38.103.170.236`.
   - Setup `/var/www/kampus-dosen` directory structure (`releases/`, `shared/`, `current` symlink).
   - Ensure permissions and services are active (`kampus-api.service` active and running on port 3005, Apache virtualhost enabled with `proxy` and `proxy_http`).
   - Verify live site online via `curl -I -H "Host: kampus.rumahku.web.id" http://38.103.170.236/` and API endpoints.
7. Verification & Tests:
   - Run `node tests/runner.js`. All 71 tests (including Tier 1, 3, and 4 deployment tests) must pass!
   - Write comprehensive `handoff.md` and `progress.md` in `c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m3_1`.
   - Send completion message to orchestrator.
