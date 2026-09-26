# Issue-to-Fix Summary & Technical Learning Log

Concise historical registry of system issues, root causes, technical fixes, and prevention rules for Dunia_Kampus (Aplikasi Dosen RPS).

---

### [BUILD_COMPILER] TypeScript strict mode compilation errors in apps/web
- **ID**: `fix-m1-ts-build` | **Date**: 2026-09-24T08:30:00.000Z
- **User Request**: Fix frontend build errors preventing npm run build in apps/web
- **Root Cause**: tsconfig enabled noUnusedLocals and noUnusedParameters, but React and several icons/parameters were unused across wizard and components
- **Technical Fix**: Removed unused React imports (React 18 JSX transform), cleaned unreferenced Lucide icon imports, and added explicit TypeScript type annotations to event parameters
- **Affected Files**: `rps-form-app/apps/web/src/pages/Wizard.tsx`, `rps-form-app/apps/web/src/components/RpsForm/`
- **Prevention Rule**: `RULE_TS_STRICT_UNUSED_SYMBOLS`
- **Verified By**: Worker M1 / npm --prefix apps/web run build

---

### [DOCX_EXPORT] DOCX table corruption and LibreOffice PDF conversion timeouts
- **ID**: `fix-m1-docx-pdf-export` | **Date**: 2026-09-24T09:15:00.000Z
- **User Request**: Exporting RPS to DOCX and converting to PDF fails or produces corrupted tables
- **Root Cause**: Docxtemplater paragraph loops inside table rows with vertical XML cell merges (<w:vMerge>) corrupted Word document XML; headless LibreOffice hung without swap space
- **Technical Fix**: Isolated dynamic weekly plan loop rows from vertically merged identity header cells, and configured LibreOffice execution timeout with fallback error handler and 1GB swap requirement on VPS
- **Affected Files**: `rps-form-app/apps/api/src/services/docx.service.ts`, `rps-form-app/templates/processed/rps-template-processed.docx`
- **Prevention Rule**: `RULE_DOCX_NO_VERTICAL_MERGE_LOOP`
- **Verified By**: Worker M1 / Tier 1 test_export_endpoints.js & Tier 3 pipeline tests

---

### [AI_INTROSPECTION] AI Router Introspection & Layer 2 Doctor Diagnostics Facade Violation
- **ID**: `fix-m2-router-introspection` | **Date**: 2026-09-24T10:45:00.000Z
- **User Request**: Provide AI DX endpoints and authentic 3-layer anti-hallucination diagnostic without hardcoded mock responses
- **Root Cause**: Express route discovery relied on static list and runDoctorDiagnostics simulated curl loopback rather than dynamically traversing Express router stack and executing genuine HTTP loopback requests
- **Technical Fix**: Implemented extractExpressRoutes crawler walking app._router.stack recursively, wired genuine HTTP loopback requests to /api/rps, and bound live Express instance to AiService via setApp(app)
- **Affected Files**: `rps-form-app/apps/api/src/services/ai.service.ts`, `rps-form-app/apps/api/src/server.ts`
- **Prevention Rule**: `RULE_GENUINE_INTROSPECTION`
- **Verified By**: Worker M2 / Tier 1 test_ai_dx_endpoints.js & Tier 1 test_persistent_logs.js

---

### [VPS_DEPLOYMENT] VPS Deployment Multi-Tenant Conflict Risk & Deadlock Prevention
- **ID**: `fix-m3-vps-isolation-packaging` | **Date**: 2026-09-24T11:30:00.000Z
- **User Request**: Deploy to VPS 38.103.170.236 without scp -r, without pipe deadlocks, and without disturbing existing tenants (syukran, arabiq, uncm)
- **Root Cause**: Raw recursive folder uploads (scp -r) can overwrite root directories; Windows-WSL binary pipes cause buffer deadlocks; shared ports/directories risk colliding with existing Apache virtual hosts
- **Technical Fix**: Packaged production bundle into web_build.zip, enforced remote unzip -o, strictly isolated directory to /var/www/kampus-dosen with dedicated Node.js port 3005 and Apache reverse proxy kampus.conf, and created fix_server.php 1-click fallback script
- **Affected Files**: `deploy.ps1`, `deploy.sh`, `fix_server.php`, `kampus.conf`, `kampus-api.service`
- **Prevention Rule**: `RULE_VPS_ZIP_DEPLOY_ISOLATION`
- **Verified By**: Worker M3 / Tier 1 test_vps_scripts.js & Tier 3 test_deploy_package_contents.js

---
### [VERIFICATION] Test verification issue
- **ID**: `fix-1790251519567` | **Date**: 2026-09-24T12:05:19.567Z
- **User Request**: Verify endpoint functionality
- **Root Cause**: Testing suite verification
- **Technical Fix**: Automated test post
- **Prevention Rule**: `RULE_TEST_VERIFY`
- **Verified By**: Tester

---

### [TECHNICAL_FIX] Reviewer M3 Verification Test
- **ID**: `fix-1790252374196` | **Date**: 2026-09-24T12:19:34.196Z
- **Root Cause**: Adversarial probe testing
- **Technical Fix**: Verified genuine logging pipeline
- **Verified By**: Agent

---

