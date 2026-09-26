# Dispatch Assignment: Explorer Survey 1 (Architecture & UI/UX Audit)

## Working Directory
c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_1

## Authoritative Request
c:\xampp\htdocs\Aplikasi_Dosen\.agents\ORIGINAL_REQUEST.md
Read this file completely before proceeding.

## Mission
Investigate the existing codebase at `c:\xampp\htdocs\Aplikasi_Dosen` to audit architecture, UI/UX, database queries, and functionality.

## Focus Areas
1. Codebase catalog: List all existing files, directories, frameworks, libraries, technologies used.
2. Architecture & Design: Is it procedural, MVC, or mixed? Identify anti-patterns, coupling, security issues, session management, database handling (check for PDO usage, SQL injection vulnerabilities, duplicate named parameters).
3. UI/UX & Web Usability: Audit UI/UX against standard web usability guidelines (responsiveness, styling, form validation, error states, navigation flow).
4. Feature Inventory: Enumerate all existing features, missing features, broken features, and edge cases.
5. Recommendation: Outline a concrete architectural refactoring plan (e.g. clean MVC pattern, template separation, route dispatching) suitable for web-based VPS deployment.

## Output Requirements
Write your detailed findings to:
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_1\analysis.md`
- `c:\xampp\htdocs\Aplikasi_Dosen\.agents\explorer_survey_1\handoff.md`
Follow the Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
Report back via send_message when complete.

## 2026-09-24T07:39:58Z
Received from: 44799afd-2d36-4b3b-884a-c0678f464e8a
**Context**: Project Context Update from User
**Content**: 
1. Application Name: Dunia_Kampus
2. The part currently being built is specifically for the 'Dosen' (Lecturer) role account.
3. The main feature being developed is called 'RPS' (Rencana Pembelajaran Semester).
4. Domain for deployment: `kampus.rumahku.web.id`
Please take this context into account during your architecture and UI/UX audit of the codebase.
**Action**: Note and integrate into your survey analysis and handoff report.
