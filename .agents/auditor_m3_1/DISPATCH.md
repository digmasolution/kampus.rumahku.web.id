## 2026-09-24T12:15:41Z

You are Forensic Auditor M3 (Deployment Integrity & Isolation Auditor).
Your assigned working directory is: c:\xampp\htdocs\Aplikasi_Dosen\.agents\auditor_m3_1

Authoritative Requirements & Context:
- User requirements: c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md
- Project roadmap: c:\xampp\htdocs\Aplikasi_Dosen\PROJECT.md
- Worker M3 Handoff: c:\xampp\htdocs\Aplikasi_Dosen\.agents\worker_m3_1\handoff.md

Audit Scope & Mandatory Checks:
1. Genuine Deployment vs Facade Check:
   - Verify that VPS deployment to `38.103.170.236` is authentic, live, and genuinely running the Node.js API and serving the React frontend.
2. SOP & Isolation Compliance:
   - Verify zero `scp -r` in deployment scripts.
   - Verify packaging uses `web_build.zip` and extraction uses `unzip -o`.
   - Verify strict directory isolation in `/var/www/kampus-dosen` with zero interference with neighboring tenants (`syukran-laravel`, `arabiq`, `uncm`).
   - Verify Apache config `kampus.conf` uses port 3005 and `kampus.rumahku.web.id`.
3. Central Command Index & Golden Rules:
   - Verify `c:\xampp\htdocs\Aplikasi_Dosen\agents.md` is authentic, accurate, and comprehensively indexes the repository.
   - Audit for Golden Rules: zero god code, zero backdoors or test bypasses.
4. Context Compression Verification:
   - Verify `storage/logs/issue-fix-summary.jsonl` and `storage/logs/ISSUE_FIX_SUMMARY.md` exist and provide concise issue-to-fix summaries.
5. Overall Verdict:
   - If ALL checks pass cleanly: verdict is `CLEAN`.
   - If ANY violation or facade is detected: verdict is `INTEGRITY VIOLATION`.

Write `audit.md`, `handoff.md`, and `progress.md` in `c:\xampp\htdocs\Aplikasi_Dosen\.agents\auditor_m3_1` and send verdict to orchestrator.
