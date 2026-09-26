# Handoff Report: Architecture & UI/UX Audit Survey (Explorer Survey 1)

**Working Directory:** `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_1`  
**Report Type:** Hard Handoff (Investigation Complete)  
**Parent Agent ID:** `44799afd-2d36-4b3b-884a-c0678f464e8a`  
**Target Project:** Dunia_Kampus (Aplikasi Dosen - RPS)  
**Deployment Target:** `kampus.rumahku.web.id` on VPS `38.103.170.236`  

---

## 1. Observation

### O1. Frontend Build Fails on TypeScript Compilation
Running `npm run build -w apps/web` in `c:\xampp\htdocs\Aplikasi_Dosen\rps-form-app` produced the following verbatim errors (exit code 1):
```text
> web@1.0.0 build
> tsc && vite build

src/App.tsx(1,1): error TS6133: 'React' is declared but its value is never read.
src/App.tsx(10,21): error TS7006: Parameter 'path' implicitly has an 'any' type.
src/App.tsx(44,19): error TS7031: Binding element 'children' implicitly has an 'any' type.
src/pages/Dashboard.tsx(1,8): error TS6133: 'React' is declared but its value is never read.
src/pages/DashboardMockup.tsx(1,1): error TS6133: 'React' is declared but its value is never read.
src/pages/TemplateSettingsMockup.tsx(1,8): error TS6133: 'React' is declared but its value is never read.
src/pages/TemplateSettingsMockup.tsx(3,43): error TS6133: 'AlertTriangle' is declared but its value is never read.
src/pages/WizardMockup.tsx(1,8): error TS6133: 'React' is declared but its value is never read.
src/pages/WizardMockup.tsx(2,1): error TS6133: 'Link' is declared but its value is never read.
```

### O2. Empty Scaffolding Folders Across API and Web
Inspection of the directory tree revealed:
- `apps/api/src/controllers`: Empty directory (0 files)
- `apps/api/src/exporters`: Empty directory (0 files)
- `apps/api/src/routes`: Empty directory (0 files)
- `apps/api/src/services`: Empty directory (0 files)
- `apps/api/src/templates`: Empty directory (0 files)
- `apps/api/src/validators`: Empty directory (0 files)
- `apps/web/src/components/ui`: Empty directory (0 files)
- `apps/web/src/forms`: Empty directory (0 files)
- `apps/web/src/hooks`: Empty directory (0 files)
- `apps/web/src/layouts`: Empty directory (0 files)
- `apps/web/src/services`: Empty directory (0 files)
- `apps/web/src/stores`: Empty directory (0 files)
- `apps/web/src/types`: Empty directory (0 files)
- `apps/web/src/utils`: Empty directory (0 files)

All backend endpoints are in a single 166-line file: `apps/api/src/server.ts`.

### O3. Security Vulnerability: Command Injection in PDF Export
In `apps/api/src/server.ts` lines 120-137:
```typescript
const files = fs.readdirSync(exportDir).filter(f => f.startsWith("RPS_" + docData.courseCode) && f.endsWith('.docx'));
...
const latestDocx = path.join(exportDir, files[files.length - 1]);
const cmd = 'soffice --headless --convert-to pdf "' + latestDocx + '" --outdir "' + exportDir + '"';
exec(cmd, (err, stdout, stderr) => { ... });
```
Unsanitized input from `docData.courseCode` is embedded into shell string interpolation passed to `child_process.exec()`.

### O4. Security Vulnerability: Unauthenticated Arbitrary File Overwrite
In `apps/api/src/server.ts` lines 143-156:
```typescript
app.post('/api/templates/upload', upload.single('template'), (req, res) => {
  ...
  const targetPath = path.resolve(__dirname, '../../../templates/processed/rps-template-processed.docx');
  fs.copyFileSync(req.file.path, targetPath);
  fs.unlinkSync(req.file.path);
  res.json({ success: true, message: "Template berhasil diperbarui" });
});
```
Any caller without authentication can upload any file to overwrite `rps-template-processed.docx`.

### O5. Disconnected Frontend Form Inputs and Mock Data
In `apps/web/src/pages/WizardMockup.tsx`:
- Lines 23-45: `saveMockDataAndGetId()` submits hardcoded JSON:
  ```typescript
  body: JSON.stringify({
    title: 'Draft Logika Matematika',
    courseName: 'LOGIKA MATEMATIKA',
    courseCode: 'MKK209',
    data: {
       institusi: 'UNIVERSITAS CIPTA MANDIRI',
       programStudi: 'PENDIDIKAN MATEMATIKA',
       sksT: '2',
       sksP: '0',
       sks: '2',
       tanggal: '13 Maret 2024',
       dosenPengembang: 'Dian Kristanti, M.Pd.',
       koordinator: 'Dazrullisa, M.Pd.'
    }
  })
  ```
- Lines 98-128: All inputs use uncontrolled `defaultValue="..."`. User input is discarded.
- Line 437: `<button ...>Simpan Draft</button>` has no `onClick` handler.
- Line 205 and line 294: `case 4:` is declared twice in `renderStepContent()`.

### O6. Dual Nested Sidebars on Settings Page
In `apps/web/src/App.tsx` lines 44-59:
```typescript
function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        ...
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```
In `apps/web/src/pages/TemplateSettingsMockup.tsx` lines 30-51:
```typescript
return (
  <div className="flex h-screen bg-gray-50 font-sans">
    <div className="w-64 bg-[#2b3a8c] text-white flex flex-col">
       ...
       <h1 className="text-2xl font-bold">RPS Builder</h1>
       <nav className="flex-1 mt-6"> ... </nav>
    </div>
    ...
```
Visiting `/settings` renders two adjacent sidebars.

### O7. Inoperable Mobile Menu
In `apps/web/src/App.tsx` lines 49-52:
```typescript
<header className="bg-white shadow-sm h-16 flex items-center px-4 md:hidden">
   <Menu className="w-6 h-6 text-gray-600" />
   <h1 className="text-xl font-bold text-blue-900 ml-4">RPS Builder</h1>
</header>
```
Sidebar has `hidden md:flex` (line 13). The mobile `<Menu>` icon has no `onClick` handler or state. Navigation on mobile viewports is impossible.

### O8. Hardcoded Localhost API Endpoints
Endpoints pointing to `http://localhost:3000` are hardcoded in:
- `apps/web/src/pages/Dashboard.tsx:8`
- `apps/web/src/pages/WizardMockup.tsx:24, 51, 66, 68`
- `apps/web/src/pages/TemplateSettingsMockup.tsx:19`

### O9. Physical SQLite Database Content
Querying the physical SQLite database `rps-form-app/prisma/dev.db` via Node script:
- `User` count: 0
- `Template` count: 0
- `RpsDocument` count: 4 records (all `Draft Logika Matematika`, `MKK209`, status `DRAFT`).

---

## 2. Logic Chain

1. **Build Infeasibility (O1 -> Conclusion 1)**:
   Because `apps/web` fails TypeScript compilation under `tsc`, Vite cannot bundle production assets. Deploying the frontend to a web server in its current state will either fail the build step or require disabling type checking.
2. **Architecture Breakdown (O2 -> Conclusion 2)**:
   The existence of 14 empty scaffolding directories alongside 166 lines of monolithic `server.ts` and 452 lines of `WizardMockup.tsx` demonstrates that the architectural separation (MVC / layered services) was planned but never implemented. The codebase is highly coupled and unmaintainable.
3. **Security Hazard (O3, O4 -> Conclusion 3)**:
   Passing unescaped course codes into `exec(soffice ...)` constitutes a direct command injection vector on the host VPS. Permitting unauthenticated file uploads that immediately overwrite the master DOCX template creates an instant Denial of Service vulnerability.
4. **Functional Illusion / Mockup (O5, O8, O9 -> Conclusion 4)**:
   The UI presents an interactive multi-step form, but user inputs are uncontrolled (`defaultValue`). Saving and exporting sends static mock data (`saveMockDataAndGetId`), while "Simpan Draft" is a no-op. Furthermore, hardcoded `http://localhost:3000` will fail on `kampus.rumahku.web.id`. The feature is functionally inoperative for real lecturer use.
5. **Usability & UX Failures (O6, O7 -> Conclusion 5)**:
   The duplicate sidebar on `/settings` and the non-functional mobile hamburger icon represent critical usability violations of standard web design principles.
6. **Ecosystem & Deployment Gaps (Requirements R2, R3 -> Conclusion 6)**:
   There is no AI agent communication endpoint, no persistent AI error log/learning table in Prisma, and no automated zip-and-deploy script targeting VPS `38.103.170.236`.

---

## 3. Caveats

- **No Active Backend Server at Survey Time**: Port 3000 and Port 5173 were inactive during audit; observations were conducted via direct source code analysis, static compilation, and direct database queries via Prisma Client.
- **LibreOffice Dependency**: LibreOffice (`soffice`) is not installed on the local Windows development machine (reported as failing by `scripts/doctor.js`). Testing actual PDF binary generation must occur on a system with LibreOffice installed or in the target Linux VPS environment.
- **No PHP Source Files**: Despite the project directory being located under `c:\xampp\htdocs\Aplikasi_Dosen` and user rules emphasizing PDO safety, there are zero `.php` files in this repository. The entire application is a Node.js/TypeScript and React stack.

---

## 4. Conclusion

The application in its current state is a prototype mockup with critical blockers preventing deployment to `kampus.rumahku.web.id`:
1. It does not build for production.
2. It suffers from high-severity security vulnerabilities (command injection and arbitrary template overwrite).
3. The multi-step form is disconnected from actual user input and drops almost all document data during export.
4. The UI exhibits severe layout glitches (duplicate sidebars, dead mobile menu).
5. All AI ecosystem requirements (R2) and VPS deployment scripts (R3) are yet to be built.

Refactoring to a clean, modular MVC backend and a reactive Zustand-backed React frontend with environment-aware endpoints is strictly necessary before deployment.

---

## 5. Verification Method

### How to Independently Verify Findings:

1. **Verify Frontend Build Failure**:
   ```powershell
   cd c:\xampp\htdocs\Aplikasi_Dosen\rps-form-app
   npm run build -w apps/web
   ```
   *Expected result*: Process exits with code 1, displaying TS6133, TS7006, TS7031 errors.

2. **Verify Monolith & Empty Scaffolding**:
   ```powershell
   Get-ChildItem -Path c:\xampp\htdocs\Aplikasi_Dosen\rps-form-app\apps\api\src -Directory
   Get-ChildItem -Path c:\xampp\htdocs\Aplikasi_Dosen\rps-form-app\apps\web\src -Directory
   ```
   *Inspect directories*: Confirm `controllers`, `routes`, `services`, `validators`, `forms`, `stores`, `types` contain 0 files.

3. **Verify Vulnerabilities in `server.ts`**:
   Inspect `c:\xampp\htdocs\Aplikasi_Dosen\rps-form-app\apps\api\src\server.ts`:
   - Line 128: Check unescaped `soffice` command string concatenation in `exec()`.
   - Line 151: Check unauthenticated `fs.copyFileSync` overwriting `rps-template-processed.docx`.

4. **Verify Double Sidebar & Mobile Menu Glitch**:
   Inspect `c:\xampp\htdocs\Aplikasi_Dosen\rps-form-app\apps\web\src\pages\TemplateSettingsMockup.tsx` lines 30-51 (duplicate `<Sidebar>`) and `apps/web/src/App.tsx` lines 49-52 (dead `<Menu>` icon).

5. **Verify Hardcoded Endpoints**:
   ```powershell
   Select-String -Path c:\xampp\htdocs\Aplikasi_Dosen\rps-form-app\apps\web\src\**\*.tsx -Pattern "http://localhost:3000"
   ```

### Invalidation Conditions:
This handoff report is invalidated if:
- `npm run build -w apps/web` compiles cleanly with zero errors.
- `server.ts` is modularized into `routes/`, `controllers/`, and `services/` with parameter validation.
- All hardcoded `localhost:3000` strings are replaced with environment-aware API clients.
- Wizard form fields capture and submit real state rather than static mock JSON.
