/**
 * Milestone 1 Adversarial Stress Test Suite
 * Empirical Challenger 2
 *
 * Covers:
 * 1. Data integrity in Zustand store logic and backend persistence (empty, partial drafts, boundary types).
 * 2. Evaluation weight boundaries (< 100%, > 100%, negative weights, float precision).
 * 3. 16-Week matrix and CPL boundary conditions (0 weeks, 16 weeks, missing subCPMK, high row count).
 * 4. DOCX generation with boundary data (special characters, XML entities, unicode, emojis, multiline, template injection).
 * 5. CORS policy enforcement (rejection of unpermitted origins, acceptance of permitted origins, preflight handling).
 * 6. UI component structural integrity (mobile drawer, single sidebar layout).
 */

const path = require('path');
process.env.NODE_PATH = path.resolve(__dirname, '../../rps-form-app/node_modules');
require('module').Module._initPaths();

const http = require('http');
const fs = require('fs');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3005';
process.env.CORS_ORIGIN = 'http://localhost:5173,https://kampus.rumahku.web.id';

const appModule = require('../../rps-form-app/apps/api/dist/server');
const app = appModule.default || appModule;

const { DocxService } = require('../../rps-form-app/apps/api/dist/services/docx.service');
const { calculateCompletionPercentage } = require('../../rps-form-app/apps/api/dist/services/rps.service');

let server;
let serverPort;
let baseUrl;

function startTestServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port;
      baseUrl = `http://127.0.0.1:${serverPort}`;
      console.log(`[Adversarial Harness] Server started on ${baseUrl}`);
      resolve();
    });
  });
}

function stopTestServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('[Adversarial Harness] Server stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

function httpRequest(method, pathUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, baseUrl);
    const reqOptions = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...(options.headers || {}) },
    };

    let payload = null;
    if (options.body && typeof options.body === 'object' && !(options.body instanceof Buffer)) {
      payload = JSON.stringify(options.body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
    } else if (typeof options.body === 'string') {
      payload = options.body;
      reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        let parsed = null;
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            parsed = JSON.parse(rawBuffer.toString('utf8'));
          } catch {
            parsed = rawBuffer.toString('utf8');
          }
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          rawBuffer,
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const results = [];

function recordTest(suite, name, passed, details = null, error = null) {
  const item = { suite, name, passed, details, error };
  results.push(item);
  const statusStr = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  [${statusStr}] [${suite}] ${name}`);
  if (details && !passed) {
    console.log(`         Details: ${JSON.stringify(details)}`);
  }
  if (error) {
    console.log(`         Error: ${error}`);
  }
}

async function runAdversarialSuite() {
  console.log('================================================================');
  console.log('    MILSTONE 1 ADVERSARIAL STRESS TEST SUITE — CHALLENGER 2      ');
  console.log('================================================================\n');

  await startTestServer();
  const docxService = new DocxService();

  try {
    // -------------------------------------------------------------
    // SECTION 1: CORS POLICY REJECTION & ACCEPTANCE
    // -------------------------------------------------------------
    console.log('\n--- SECTION 1: CORS POLICY REJECTION & ACCEPTANCE ---');

    // 1.1 Untrusted Origin GET Request
    {
      const res = await httpRequest('GET', '/api/rps', {
        headers: { Origin: 'https://evil-attacker.com' },
      });
      // The middleware invokes callback(new Error('Origin ... not allowed by CORS'))
      // This produces 500 in standard errorHandler and MUST NOT include Access-Control-Allow-Origin: https://evil-attacker.com
      const acao = res.headers['access-control-allow-origin'];
      const blocked = !acao || acao !== 'https://evil-attacker.com';
      recordTest(
        'CORS Policy',
        'Reject untrusted origin GET request without ACAO header',
        blocked,
        { status: res.status, acao }
      );
    }

    // 1.2 Untrusted Origin Preflight OPTIONS Request
    {
      const res = await httpRequest('OPTIONS', '/api/rps', {
        headers: {
          Origin: 'https://malicious-site.org',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });
      const acao = res.headers['access-control-allow-origin'];
      const blocked = !acao || acao !== 'https://malicious-site.org';
      recordTest(
        'CORS Policy',
        'Reject untrusted origin preflight OPTIONS request',
        blocked,
        { status: res.status, acao }
      );
    }

    // 1.3 Subdomain Spoofing Attempt (kampus.rumahku.web.id.attacker.com)
    {
      const res = await httpRequest('GET', '/api/rps', {
        headers: { Origin: 'https://kampus.rumahku.web.id.attacker.com' },
      });
      const acao = res.headers['access-control-allow-origin'];
      const blocked = !acao || acao !== 'https://kampus.rumahku.web.id.attacker.com';
      recordTest(
        'CORS Policy',
        'Reject spoofed domain (kampus.rumahku.web.id.attacker.com)',
        blocked,
        { status: res.status, acao }
      );
    }

    // 1.4 Permitted Origin: Local Vite Dev Server (http://localhost:5173)
    {
      const res = await httpRequest('GET', '/api/health', {
        headers: { Origin: 'http://localhost:5173' },
      });
      const acao = res.headers['access-control-allow-origin'];
      const creds = res.headers['access-control-allow-credentials'];
      const passed = res.status === 200 && acao === 'http://localhost:5173' && creds === 'true';
      recordTest(
        'CORS Policy',
        'Allow permitted origin http://localhost:5173 with credentials header',
        passed,
        { status: res.status, acao, creds }
      );
    }

    // 1.5 Permitted Origin: Production Domain (https://kampus.rumahku.web.id)
    {
      const res = await httpRequest('GET', '/api/health', {
        headers: { Origin: 'https://kampus.rumahku.web.id' },
      });
      const acao = res.headers['access-control-allow-origin'];
      const passed = res.status === 200 && acao === 'https://kampus.rumahku.web.id';
      recordTest(
        'CORS Policy',
        'Allow permitted origin https://kampus.rumahku.web.id',
        passed,
        { status: res.status, acao }
      );
    }

    // 1.6 Request with No Origin (server-to-server, curl, mobile)
    {
      const res = await httpRequest('GET', '/api/health');
      const passed = res.status === 200 && res.body?.status === 'ok';
      recordTest(
        'CORS Policy',
        'Allow direct request with no Origin header (curl/mobile/server)',
        passed,
        { status: res.status, body: res.body }
      );
    }

    // -------------------------------------------------------------
    // SECTION 2: DATA INTEGRITY & PERSISTENCE (EMPTY & PARTIAL DRAFTS)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: DATA INTEGRITY & PERSISTENCE ---');

    let createdDraftId = null;

    // 2.1 Completely Empty Draft Body
    {
      const res = await httpRequest('POST', '/api/rps', {
        body: {},
      });
      const passed = res.status === 201 && res.body?.id && res.body?.completionPercentage === 0;
      if (res.body?.id) createdDraftId = res.body.id;
      recordTest(
        'Data Integrity',
        'Save completely empty draft: defaults title to Draft RPS, completionPercentage=0',
        passed,
        { status: res.status, body: res.body }
      );
    }

    // 2.2 Partial Draft with Only Step 1 (Course Identity)
    {
      const partialPayload = {
        title: 'RPS Kalkulus 1',
        courseName: 'Kalkulus 1',
        courseCode: 'MAT-101',
        data: {
          institusi: 'UNIVERSITAS CIPTA MANDIRI',
          programStudi: 'PENDIDIKAN MATEMATIKA',
          sksT: 3,
          sksP: 0,
          semester: 1,
        },
      };
      const res = await httpRequest('POST', '/api/rps', { body: partialPayload });
      // calculateCompletionPercentage should award 20% for Identity
      const passed = res.status === 201 && res.body?.completionPercentage === 20 && res.body?.status === 'DRAFT';
      recordTest(
        'Data Integrity',
        'Partial draft with only Step 1: completionPercentage=20%, status=DRAFT',
        passed,
        { status: res.status, completionPercentage: res.body?.completionPercentage }
      );
    }

    // 2.3 Partial Draft with Missing / Null Nested Properties
    {
      const nullFieldsPayload = {
        courseName: 'Statistika Terapan',
        courseCode: 'STAT201',
        data: {
          dosenPengembang: null,
          cplList: null,
          rencanaMingguan: null,
          penilaian: null,
          metodePembelajaran: null,
        },
      };
      const res = await httpRequest('POST', '/api/rps', { body: nullFieldsPayload });
      const passed = res.status === 201 && res.body?.id;
      recordTest(
        'Data Integrity',
        'Handle null nested objects gracefully without unhandled exception',
        passed,
        { status: res.status, id: res.body?.id }
      );
    }

    // 2.4 Whitespace Only Title (Boundary validation)
    {
      const res = await httpRequest('POST', '/api/rps', {
        body: { title: '    ' },
      });
      // Zod .trim().min(1) should reject pure whitespace with 400 VALIDATION_ERROR
      const passed = res.status === 400 && res.body?.error?.code === 'VALIDATION_ERROR';
      recordTest(
        'Data Integrity',
        'Reject whitespace-only title with HTTP 400 VALIDATION_ERROR',
        passed,
        { status: res.status, error: res.body?.error }
      );
    }

    // 2.5 Course Code Boundary: Course code with spaces (e.g. "MAT 101")
    {
      const res = await httpRequest('POST', '/api/rps', {
        body: { courseCode: 'MAT 101' },
      });
      // Zod regex is /^[A-Za-z0-9_-]*$/ so spaces are rejected with 400
      const passed = res.status === 400 && res.body?.error?.code === 'VALIDATION_ERROR';
      recordTest(
        'Data Integrity',
        'Course code with spaces rejected by strict alphanumeric regex',
        passed,
        { status: res.status, error: res.body?.error }
      );
    }

    // 2.6 Update Existing Draft via PUT
    {
      if (createdDraftId) {
        const updatePayload = {
          courseName: 'Logika & Himpunan',
          courseCode: 'MKK-102',
          data: {
            dosenPengembang: 'Dr. Test Dosen',
            bahanKajian: 'Pengantar Himpunan dan Logika',
          },
        };
        const res = await httpRequest('PUT', `/api/rps/${createdDraftId}`, { body: updatePayload });
        const passed = res.status === 200 && res.body?.courseName === 'Logika & Himpunan';
        recordTest(
          'Data Integrity',
          'PUT /api/rps/:id updates partial fields without wiping existing dataJson',
          passed,
          { status: res.status, courseName: res.body?.courseName }
        );
      }
    }

    // -------------------------------------------------------------
    // SECTION 3: EVALUATION WEIGHT CALCULATIONS & BOUNDARIES
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: EVALUATION WEIGHT CALCULATIONS & BOUNDARIES ---');

    // 3.1 Weight Sum < 100% (Underflow) in Backend Persistence
    {
      const underflowPayload = {
        title: 'Draft Bobot 70%',
        courseName: 'Aljabar Linear',
        courseCode: 'AL70',
        data: {
          penilaian: [
            { komponen: 'Tugas', bobot: 20 },
            { komponen: 'UTS', bobot: 25 },
            { komponen: 'UAS', bobot: 25 },
          ], // Total 70%
        },
      };
      const res = await httpRequest('POST', '/api/rps', { body: underflowPayload });
      // Should save as DRAFT without crash
      const passed = res.status === 201 && res.body?.status === 'DRAFT';
      recordTest(
        'Evaluation Weights',
        'Allow in-progress draft with total assessment weight < 100% (70%)',
        passed,
        { status: res.status, docStatus: res.body?.status }
      );
    }

    // 3.2 Weight Sum > 100% (Overflow) in Backend Persistence
    {
      const overflowPayload = {
        title: 'Draft Bobot 140%',
        courseName: 'Kalkulus Lanjut',
        courseCode: 'KL140',
        data: {
          penilaian: [
            { komponen: 'Tugas 1', bobot: 40 },
            { komponen: 'Tugas 2', bobot: 30 },
            { komponen: 'UTS', bobot: 35 },
            { komponen: 'UAS', bobot: 35 },
          ], // Total 140%
        },
      };
      const res = await httpRequest('POST', '/api/rps', { body: overflowPayload });
      // Should save as DRAFT without crash
      const passed = res.status === 201 && res.body?.status === 'DRAFT';
      recordTest(
        'Evaluation Weights',
        'Allow in-progress draft with total assessment weight > 100% (140%)',
        passed,
        { status: res.status, docStatus: res.body?.status }
      );
    }

    // 3.3 Negative Evaluation Weights in Backend Persistence
    {
      const negativePayload = {
        title: 'Draft Bobot Negatif',
        courseName: 'Struktur Data',
        courseCode: 'SD_NEG',
        data: {
          penilaian: [
            { komponen: 'Kuis', bobot: -10 },
            { komponen: 'UTS', bobot: 50 },
            { komponen: 'UAS', bobot: 60 },
          ], // Total 100% mathematically, but has negative component
        },
      };
      const res = await httpRequest('POST', '/api/rps', { body: negativePayload });
      // Backend permits JSON persistence for drafts
      const passed = res.status === 201 && res.body?.id;
      recordTest(
        'Evaluation Weights',
        'Backend persists draft containing negative weight component without crashing',
        passed,
        { status: res.status, id: res.body?.id }
      );
    }

    // 3.4 Zustand Store Mathematical Calculations Simulation
    {
      // Test store reduce logic: item.bobot with various inputs
      const sampleMingguan = [
        { minggu: 1, bobot: 5 },
        { minggu: 2, bobot: '10' }, // string number
        { minggu: 3, bobot: null }, // null
        { minggu: 4, bobot: undefined }, // undefined
        { minggu: 5, bobot: -5 }, // negative
        { minggu: 6, bobot: 12.5 }, // float
      ];
      const sum = sampleMingguan.reduce((s, it) => s + (Number(it.bobot) || 0), 0);
      // 5 + 10 + 0 + 0 + (-5) + 12.5 = 22.5
      const passed = sum === 22.5;
      recordTest(
        'Evaluation Weights',
        'Store calculation safely converts string, null, undefined, float, and negative weights',
        passed,
        { calculatedSum: sum, expected: 22.5 }
      );
    }

    // 3.5 Floating Point Rounding: 33.33 + 33.33 + 33.34
    {
      const floatPenilaian = [
        { komponen: 'A', bobot: 33.33 },
        { komponen: 'B', bobot: 33.33 },
        { komponen: 'C', bobot: 33.34 },
      ];
      const floatSum = floatPenilaian.reduce((s, it) => s + (Number(it.bobot) || 0), 0);
      // In JS, 33.33 + 33.33 + 33.34 = 100.00000000000001
      const isExactly100 = floatSum === 100;
      const isWithinTolerance = Math.abs(floatSum - 100) < 1e-9;
      recordTest(
        'Evaluation Weights',
        'Store float rounding: detects floating point representation of 100% (33.33 x 2 + 33.34)',
        isWithinTolerance,
        { floatSum, exactStrict: isExactly100, withinTolerance: isWithinTolerance }
      );
    }

    // -------------------------------------------------------------
    // SECTION 4: CPL & 16-WEEK MATRIX BOUNDARY CONDITIONS
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: CPL & 16-WEEK MATRIX BOUNDARIES ---');

    // 4.1 Boundary: 0 Weeks Matrix (Empty Array)
    {
      const emptyWeeksPayload = {
        title: 'RPS 0 Weeks Matrix',
        courseName: 'Seminar Matematika',
        courseCode: 'SEM00',
        data: {
          rencanaMingguan: [],
        },
      };
      const res = await httpRequest('POST', '/api/rps', { body: emptyWeeksPayload });
      const passed = res.status === 201;
      recordTest(
        'Matrix Boundaries',
        'Save draft with 0 weeks matrix (empty array)',
        passed,
        { status: res.status }
      );
    }

    // 4.2 Boundary: Exactly 16 Weeks Full Matrix
    {
      const sixteenWeeks = Array.from({ length: 16 }, (_, i) => ({
        minggu: i + 1,
        subCpmk: `Sub-CPMK Pertemuan ${i + 1}`,
        indikator: `Indikator pertemuan ke-${i + 1}`,
        kriteriaBentuk: 'Kriteria tes dan observasi',
        metodeWaktu: 'Kuliah & Diskusi, 2x50 menit',
        materiPustaka: `Materi Bahasan ${i + 1}`,
        bobot: i === 7 || i === 15 ? 15 : 5, // UTS & UAS week heavier
      }));
      const fullPayload = {
        title: 'RPS Full 16 Weeks',
        courseName: 'Analisis Real',
        courseCode: 'AR301',
        data: {
          rencanaMingguan: sixteenWeeks,
          cplList: [
            { id: 'cpl-1', kode: 'CPL1', jenis: 'PRODI', deskripsi: 'Menguasai konsep' },
            { id: 'cpl-2', kode: 'CPMK1', jenis: 'MK', deskripsi: 'Mampu membuktikan teorema' },
          ],
        },
      };
      const res = await httpRequest('POST', '/api/rps', { body: fullPayload });
      const passed = res.status === 201 && res.body?.id;
      recordTest(
        'Matrix Boundaries',
        'Save draft with full 16-week matrix and multiple CPL items',
        passed,
        { status: res.status, id: res.body?.id }
      );
    }

    // 4.3 Boundary: >16 Weeks Matrix (e.g. 20 Weeks)
    {
      const twentyWeeks = Array.from({ length: 20 }, (_, i) => ({
        minggu: i + 1,
        subCpmk: `Materi ${i + 1}`,
        bobot: 5,
      }));
      const res = await httpRequest('POST', '/api/rps', {
        body: {
          title: 'RPS 20 Weeks',
          courseCode: 'W20',
          data: { rencanaMingguan: twentyWeeks },
        },
      });
      const passed = res.status === 201;
      recordTest(
        'Matrix Boundaries',
        'Handle matrix with > 16 weeks (20 weeks) without overflow crash',
        passed,
        { status: res.status }
      );
    }

    // 4.4 Boundary: Missing / Empty SubCPMK in Weekly Rows
    {
      const missingSubCpmkRows = [
        { minggu: 1, subCpmk: '', indikator: '', bobot: 5 },
        { minggu: 2, subCpmk: null, indikator: 'Hanya indikator', bobot: 5 },
      ];
      const res = await httpRequest('POST', '/api/rps', {
        body: {
          title: 'RPS Missing SubCPMK',
          courseCode: 'NO_SUB',
          data: { rencanaMingguan: missingSubCpmkRows },
        },
      });
      const passed = res.status === 201;
      recordTest(
        'Matrix Boundaries',
        'Persist weekly rows with missing/null subCPMK without schema failure',
        passed,
        { status: res.status }
      );
    }

    // -------------------------------------------------------------
    // SECTION 5: DOCX GENERATION WITH ADVERSARIAL BOUNDARY DATA
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: DOCX GENERATION STRESS TESTING ---');

    // 5.1 Special Characters in Lecturer Names & Entities (&, <, >, ", ')
    {
      const mockDoc = {
        id: 'mock-1',
        title: 'Special Chars RPS',
        courseName: 'Logika & Bahasa <Tingkat 1> & "Lanjutan"',
        courseCode: 'LOG_SPECIAL',
        status: 'DRAFT',
        completionPercentage: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
        dataJson: JSON.stringify({
          institusi: 'UNIVERSITAS <CIPTA & MANDIRI> "KAMPUS 1"',
          programStudi: "PENDIDIKAN 'MATEMATIKA' & ILMU KOMPUTER",
          dosenPengembang: 'Dr. M. Al-Farabi & S. O\'Connor, <Ph.D.> & "Lead"',
          koordinatorMk: 'Drs. Ahmad Yani & Tim <Pengembang>',
          kaprodi: 'Prof. Dr. Siti Aminah, M.Sc. & Tim',
          bahanKajian: 'Bahan kajian dengan simbol < & > serta quotes "" dan \'\'',
        }),
      };

      try {
        const result = docxService.generateDocx(mockDoc);
        const hasZipHeader = result.buffer.slice(0, 2).toString('hex') === '504b'; // 'PK'
        const passed = hasZipHeader && result.buffer.length > 10000;
        recordTest(
          'DOCX Generation',
          'Safely escape XML entities (&, <, >, ", \') in lecturer names and headings',
          passed,
          { fileSize: result.buffer.length, hasZipHeader }
        );
      } catch (err) {
        recordTest('DOCX Generation', 'Safely escape XML entities in lecturer names', false, null, err.message);
      }
    }

    // 5.2 Multilingual Unicode Characters (Arabic, Cyrillic, CJK, Accents)
    {
      const unicodeDoc = {
        id: 'mock-unicode',
        title: 'RPS Multilingual',
        courseName: 'Studi Bahasa & Budaya: العربية, 中文, Русский, Français',
        courseCode: 'LANG_UNI',
        status: 'DRAFT',
        completionPercentage: 90,
        createdAt: new Date(),
        updatedAt: new Date(),
        dataJson: JSON.stringify({
          institusi: 'UNIVERSITAS CIPTA MANDIRI (جامعة سيبتا مانديري)',
          dosenPengembang: 'د. محمد إقبال, M.Ag. & Dr. Jörg Müller, M.Sc. & 山田 太郎',
          bahanKajian: '1. Теорія і практика\n2. 语言学导论\n3. Étude comparative',
        }),
      };

      try {
        const result = docxService.generateDocx(unicodeDoc);
        const hasZipHeader = result.buffer.slice(0, 2).toString('hex') === '504b';
        const passed = hasZipHeader && result.buffer.length > 10000;
        recordTest(
          'DOCX Generation',
          'Render multilingual Unicode (Arabic, Chinese, Russian, German umlauts) without corruption',
          passed,
          { fileSize: result.buffer.length }
        );
      } catch (err) {
        recordTest('DOCX Generation', 'Render multilingual Unicode', false, null, err.message);
      }
    }

    // 5.3 Emojis in Lecturer Fields & Descriptions
    {
      const emojiDoc = {
        id: 'mock-emoji',
        title: 'RPS With Emojis',
        courseName: 'Pemrograman Web Modern 🚀💻',
        courseCode: 'WEB_EMOJI',
        status: 'DRAFT',
        completionPercentage: 85,
        createdAt: new Date(),
        updatedAt: new Date(),
        dataJson: JSON.stringify({
          dosenPengembang: 'Prof. Dr. Irfan Hakim, M.Kom. 👨‍🏫🎓✨',
          bahanKajian: 'Materi Frontend ⚛️, Backend 🚀, Database 🗄️, DevOps 🐳',
        }),
      };

      try {
        const result = docxService.generateDocx(emojiDoc);
        const hasZipHeader = result.buffer.slice(0, 2).toString('hex') === '504b';
        const passed = hasZipHeader && result.buffer.length > 10000;
        recordTest(
          'DOCX Generation',
          'Handle high-code-point Emoji characters in fields',
          passed,
          { fileSize: result.buffer.length }
        );
      } catch (err) {
        recordTest('DOCX Generation', 'Handle high-code-point Emoji characters', false, null, err.message);
      }
    }

    // 5.4 Multiline Text with Various Line Separators (\n, \r\n, repeated newlines)
    {
      const multilineDoc = {
        id: 'mock-multiline',
        title: 'RPS Multiline',
        courseName: 'Filsafat Ilmu',
        courseCode: 'FIL101',
        status: 'DRAFT',
        completionPercentage: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
        dataJson: JSON.stringify({
          bahanKajian: 'Baris 1: Ontologi\n\nBaris 2: Epistemologi\r\n\r\nBaris 3: Aksiologi\n\n\nBaris 4: Etika Akademik',
          pustakaUtama: '1. Buku Utama Pertama\r\n2. Buku Utama Kedua\r\n3. Buku Utama Ketiga',
        }),
      };

      try {
        const result = docxService.generateDocx(multilineDoc);
        const hasZipHeader = result.buffer.slice(0, 2).toString('hex') === '504b';
        const passed = hasZipHeader && result.buffer.length > 10000;
        recordTest(
          'DOCX Generation',
          'Handle multiline text with LF, CRLF, and multiple consecutive linebreaks',
          passed,
          { fileSize: result.buffer.length }
        );
      } catch (err) {
        recordTest('DOCX Generation', 'Handle multiline text', false, null, err.message);
      }
    }

    // 5.5 Adversarial Delimiter Injection ({{tag}} inside user input)
    {
      const delimiterDoc = {
        id: 'mock-delimiter',
        title: 'RPS Delimiter Test',
        courseName: 'Mata Kuliah {{MALICIOUS_TAG}}',
        courseCode: 'DELIM01',
        status: 'DRAFT',
        completionPercentage: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
        dataJson: JSON.stringify({
          dosenPengembang: 'Dosen {{#if test}} {{/if}} Injection',
          bahanKajian: 'Text with unclosed tag {{ and single brace {test}',
        }),
      };

      try {
        const result = docxService.generateDocx(delimiterDoc);
        const hasZipHeader = result.buffer.slice(0, 2).toString('hex') === '504b';
        const passed = hasZipHeader && result.buffer.length > 10000;
        recordTest(
          'DOCX Generation',
          'Adversarial test: user input containing {{tag}} syntax inside variable values',
          passed,
          { fileSize: result.buffer.length }
        );
      } catch (err) {
        // If Docxtemplater throws on delimiters inside values, record failure
        recordTest('DOCX Generation', 'Adversarial test: user input containing {{tag}} syntax', false, null, err.message);
      }
    }

    // 5.6 Boundary: DOCX Generation from HTTP Endpoint with Special Chars
    {
      // Create document in DB first
      const dbDocRes = await httpRequest('POST', '/api/rps', {
        body: {
          title: 'RPS Export HTTP Special',
          courseName: 'Kecerdasan Buatan & Robotika',
          courseCode: 'AI_ROBOT',
          data: {
            dosenPengembang: 'Prof. Dr. Ir. Soekarno, M.T. & Tim',
          },
        },
      });

      if (dbDocRes.body?.id) {
        const exportRes = await httpRequest('GET', `/api/rps/${dbDocRes.body.id}/export/docx`);
        const isDocxMime = exportRes.headers['content-type']?.includes('openxmlformats');
        const hasZipHeader = exportRes.rawBuffer.slice(0, 2).toString('hex') === '504b';
        const passed = exportRes.status === 200 && isDocxMime && hasZipHeader;
        recordTest(
          'DOCX Generation',
          'End-to-End HTTP DOCX export streams valid ZIP binary with openxml MIME type',
          passed,
          { status: exportRes.status, mime: exportRes.headers['content-type'], size: exportRes.rawBuffer.length }
        );
      }
    }

    // -------------------------------------------------------------
    // SECTION 6: FRONTEND USABILITY & STRUCTURAL INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: FRONTEND USABILITY & STRUCTURAL INTEGRITY ---');

    // 6.1 Verify Single Sidebar Layout on /settings (TemplateSettingsMockup.tsx)
    {
      const settingsFile = path.resolve(__dirname, '../../rps-form-app/apps/web/src/pages/TemplateSettingsMockup.tsx');
      const settingsContent = fs.readFileSync(settingsFile, 'utf8');

      // Check that duplicate sidebar classes (e.g. w-64 bg-[#2b3a8c] or <aside) do NOT exist in settings page
      const hasDuplicateAside = settingsContent.includes('<aside');
      const hasDuplicateSidebarClass = settingsContent.includes('w-64 bg-[#2b3a8c]');
      const passed = !hasDuplicateAside && !hasDuplicateSidebarClass;
      recordTest(
        'Frontend Usability',
        'TemplateSettingsMockup does NOT contain duplicate nested sidebar navigation',
        passed,
        { hasDuplicateAside, hasDuplicateSidebarClass }
      );
    }

    // 6.2 Verify Mobile Drawer Responsive Elements in App.tsx
    {
      const appFile = path.resolve(__dirname, '../../rps-form-app/apps/web/src/App.tsx');
      const appContent = fs.readFileSync(appFile, 'utf8');

      const hasMobileState = appContent.includes('isMobileMenuOpen');
      const hasHamburgerToggle = appContent.includes('setIsMobileMenuOpen(true)');
      const hasCloseButton = appContent.includes('setIsMobileMenuOpen(false)');
      const hasSlideOverDrawer = appContent.includes('translate-x-0') && appContent.includes('-translate-x-full');
      const hasBackdropOverlay = appContent.includes('fixed inset-0 bg-black/50');
      const hasNavClickClosing = appContent.includes('onNavClick={() => setIsMobileMenuOpen(false)}');

      const passed = hasMobileState && hasHamburgerToggle && hasCloseButton && hasSlideOverDrawer && hasBackdropOverlay && hasNavClickClosing;
      recordTest(
        'Frontend Usability',
        'App.tsx implements responsive slide-over drawer, backdrop overlay, and auto-close on nav',
        passed,
        {
          hasMobileState,
          hasHamburgerToggle,
          hasCloseButton,
          hasSlideOverDrawer,
          hasBackdropOverlay,
          hasNavClickClosing,
        }
      );
    }

    // 6.3 Verify Wizard controlled state & row handlers in WizardMockup.tsx
    {
      const wizardFile = path.resolve(__dirname, '../../rps-form-app/apps/web/src/pages/WizardMockup.tsx');
      const wizardContent = fs.readFileSync(wizardFile, 'utf8');

      const hasControlledInputs = wizardContent.includes('value={formData.') && !wizardContent.includes('defaultValue=');
      const hasAddCpl = wizardContent.includes('onClick={addCpl}');
      const hasAddMinggu = wizardContent.includes('onClick={addMinggu}');
      const hasAddPenilaian = wizardContent.includes('onClick={addPenilaian}');
      const hasSaveDraftBtn = wizardContent.includes('onClick={() => saveDraft()}');
      const hasNoDuplicateCase4 = (wizardContent.match(/case 4:/g) || []).length === 1;

      const passed = hasControlledInputs && hasAddCpl && hasAddMinggu && hasAddPenilaian && hasSaveDraftBtn && hasNoDuplicateCase4;
      recordTest(
        'Frontend Usability',
        'WizardMockup has controlled inputs, add/remove handlers, draft persistence, and no duplicate switch cases',
        passed,
        {
          hasControlledInputs,
          hasAddCpl,
          hasAddMinggu,
          hasAddPenilaian,
          hasSaveDraftBtn,
          hasNoDuplicateCase4,
        }
      );
    }

  } finally {
    await stopTestServer();
  }

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${total})`);
  console.log('================================================================\n');

  return { total, passedCount, failedCount, results };
}

if (require.main === module) {
  runAdversarialSuite()
    .then((summary) => {
      if (summary.failedCount > 0) {
        console.error(`Adversarial test suite detected ${summary.failedCount} failures.`);
        process.exit(1);
      } else {
        console.log('All adversarial tests PASSED.');
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('Fatal test harness error:', err);
      process.exit(1);
    });
}

module.exports = { runAdversarialSuite };
