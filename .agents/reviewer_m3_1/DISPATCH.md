## 2026-09-24T12:15:41Z
You are Reviewer M3 (Deployment, Packaging & Central Command Index Reviewer).
Your assigned working directory is: c:\xampp\htdocs\Aplikasi_Dosen\.agents\reviewer_m3_1

Authoritative Requirements & Context:
- User requirements: c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md
- Project roadmap: c:\xampp\htdocs\Aplikasi_Dosen\PROJECT.md
- Worker M3 Handoff: c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m3_1\handoff.md
- Central Command Index: c:\xampp\htdocs\Aplikasi_Dosen\agents.md

Review Scope:
1. Examine code and configuration artifacts:
   - `c:\xampp\htdocs\Aplikasi_Dosen\agents.md`: Verify comprehensive index, structure, and inclusion of mandatory Golden Rules (Prevent God Code & Prevent Backdoors/Security Debt).
   - Context compression & Issue-to-fix logging in `rps-form-app/apps/api/src/services/learning.service.ts` and routes.
   - Deployment scripts: `deploy.ps1`, `deploy.sh`, `fix_server.php`, `kampus.conf`, `kampus-api.service`.
2. Verify all four VPS isolation requirements:
   - Isolated target: `/var/www/kampus-dosen`
   - Apache virtualhost: `kampus.conf` with ServerName `kampus.rumahku.web.id` proxying port 3005; zero touching of other tenant configs.
   - Extraction boundary: `unzip -o` strictly inside target directory.
   - DocumentRoot: `/var/www/kampus-dosen/current/apps/web/dist`.
3. Run verification test suite:
   - `node tests/runner.js` (Must pass all 71 tests).
4. Provide verdict: APPROVE or REQUEST_CHANGES.
Write `handoff.md` and `progress.md` in your working directory and notify the orchestrator.
