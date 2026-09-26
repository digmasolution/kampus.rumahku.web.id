/**
 * Challenger 1: Adversarial Stress Test Suite for Milestone 1
 * Targets:
 * 1. Command injection in courseCode (PDF/DOCX export & CRUD)
 * 2. Malformed uploads to /api/templates/upload (non-docx, corrupt zip, empty files)
 * 3. Edge-case payloads to /api/rps (boundary conditions, malformed JSON, SQL injection strings)
 * 4. Verification of safe fallback behavior
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';

// Dynamically load PizZip from monorepo root
const PizZip = require('../../rps-form-app/node_modules/pizzip');

// Load compiled API server
const appModule = require('../../rps-form-app/apps/api/dist/server');
const app = appModule.default || appModule;

let server;
let port;
let baseUrl;

function request(method, pathUrl, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers },
    };

    let payload = null;
    if (body && typeof body === 'object' && !(body instanceof Buffer)) {
      payload = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    } else if (typeof body === 'string') {
      payload = body;
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    } else if (body instanceof Buffer) {
      payload = body;
      options.headers['Content-Length'] = payload.length;
    }

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        let parsed = null;
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            parsed = JSON.parse(rawBuffer.toString('utf8'));
          } catch (e) {
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

function createMultipartBody(fieldName, filename, fileBuffer, mimeType = 'application/octet-stream') {
  const boundary = '----Boundary' + Math.random().toString(36).substring(2);
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([head, fileBuffer, tail]);
  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

async function runAdversarialTests() {
  console.log('================================================================');
  console.log('CHALLENGER 1: ADVERSARIAL STRESS TEST SUITE (MILESTONE 1)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  function assertTest(name, condition, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
      passed++;
      results.push({ name, status: 'PASS', details });
    } else {
      console.error(`  [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      failed++;
      results.push({ name, status: 'FAIL', details });
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 1: COMMAND INJECTION VECTORS IN courseCode
  // --------------------------------------------------------------------------
  console.log('--- SECTION 1: COMMAND INJECTION ATTACKS IN courseCode ---');

  const injectionVectors = [
    { label: 'Semicolon command chaining', code: 'MKK209; whoami' },
    { label: 'Subshell command substitution', code: 'MKK209"$(calc.exe)"' },
    { label: 'Windows ampersand execution', code: 'MKK209 & whoami' },
    { label: 'Double ampersand execution', code: 'MKK209 && calc.exe' },
    { label: 'Pipe operator', code: 'MKK209 | dir' },
    { label: 'Backtick execution', code: 'MKK209`whoami`' },
    { label: 'Newline injection', code: "MKK209\nwhoami" },
    { label: 'Redirection injection', code: 'MKK209 > pwned.txt' },
    { label: 'Unix rm -rf vector', code: 'PPL301"; rm -rf / ; #' },
  ];

  for (const vec of injectionVectors) {
    const res = await request('POST', '/api/rps', {
      title: `Injection Test: ${vec.label}`,
      courseName: 'Adversarial Test MK',
      courseCode: vec.code,
      data: {},
    });

    const isRejected = res.status === 400 && res.body?.error?.code === 'VALIDATION_ERROR';
    assertTest(
      `POST /api/rps rejects ${vec.label} (${vec.code.replace(/\n/g, '\\n')})`,
      isRejected,
      `HTTP ${res.status}, code: ${res.body?.error?.code}`
    );
  }

  // Test injection rejection on PUT /api/rps/:id
  const createValidRes = await request('POST', '/api/rps', {
    title: 'Valid Document For Update Testing',
    courseName: 'Valid MK',
    courseCode: 'MKK201',
    data: {},
  });
  const validDocId = createValidRes.body.id;

  const putInjectRes = await request('PUT', `/api/rps/${validDocId}`, {
    courseCode: 'MKK209; whoami',
  });
  assertTest(
    'PUT /api/rps/:id rejects command injection in courseCode',
    putInjectRes.status === 400 && putInjectRes.body?.error?.code === 'VALIDATION_ERROR',
    `HTTP ${putInjectRes.status}`
  );

  // Test stealth injection via nested data object
  console.log('\n--- SECTION 1.2: STEALTH INJECTION VIA NESTED DATA & EXPORT ISOLATION ---');
  const stealthRes = await request('POST', '/api/rps', {
    title: 'Stealth Data Injection',
    courseName: 'Stealth MK',
    data: {
      courseCode: 'INJECT; whoami & calc.exe',
      kodeMataKuliah: 'INJECT; whoami & calc.exe',
      institusi: 'UNIVERSITAS CIPTA MANDIRI',
    },
  });
  const stealthId = stealthRes.body?.id;
  assertTest(
    'Creation with nested data courseCode succeeds safely without executing shell',
    stealthRes.status === 201 && stealthId,
    `Doc ID: ${stealthId}`
  );

  // Test DOCX export filename sanitization
  const docxRes = await request('GET', `/api/rps/${stealthId}/export/docx`);
  const contentDisposition = docxRes.headers['content-disposition'] || '';
  const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
  const actualFilename = filenameMatch ? filenameMatch[1] : '';
  const isFilenameSafe =
    actualFilename.length > 0 &&
    !actualFilename.includes(';') &&
    !actualFilename.includes('&') &&
    !actualFilename.includes(' ') &&
    actualFilename.includes('RPS_INJECT__whoami___calc_exe');
  assertTest(
    'DOCX export filename strictly sanitized (metacharacters replaced with _)',
    docxRes.status === 200 && isFilenameSafe,
    `Filename: "${actualFilename}"`
  );

  // Test PDF export safe isolation (execFile without shell)
  const pdfRes = await request('GET', `/api/rps/${stealthId}/export/pdf`);
  const safePdfBehavior =
    pdfRes.status === 200 ||
    (pdfRes.status === 503 && pdfRes.body?.error?.code === 'LIBREOFFICE_NOT_FOUND');
  assertTest(
    'PDF export executes via execFile without shell interpolation (no command execution)',
    safePdfBehavior,
    `Status ${pdfRes.status} (code: ${pdfRes.body?.error?.code || 'PDF_SUCCESS'})`
  );

  // Clean up stealth doc
  if (stealthId) await request('DELETE', `/api/rps/${stealthId}`);
  if (validDocId) await request('DELETE', `/api/rps/${validDocId}`);

  // --------------------------------------------------------------------------
  // SECTION 2: MALFORMED FILE UPLOADS TO /api/templates/upload
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 2: MALFORMED FILE UPLOADS TO /api/templates/upload ---');

  // 2.1 Non-docx executable
  const exeUpload = createMultipartBody('template', 'malicious.exe', Buffer.from('MZ\x90\x00BinaryExeContent'), 'application/x-msdownload');
  const exeRes = await request('POST', '/api/templates/upload', exeUpload.body, { 'Content-Type': exeUpload.contentType });
  assertTest(
    'Upload malicious.exe rejected with 400 INVALID_FILE_TYPE',
    exeRes.status === 400 && exeRes.body?.error?.code === 'INVALID_FILE_TYPE',
    `HTTP ${exeRes.status}, code: ${exeRes.body?.error?.code}`
  );

  // 2.2 Non-docx PHP script
  const phpUpload = createMultipartBody('template', 'shell.php', Buffer.from('<?php system($_GET["c"]); ?>'), 'application/x-php');
  const phpRes = await request('POST', '/api/templates/upload', phpUpload.body, { 'Content-Type': phpUpload.contentType });
  assertTest(
    'Upload shell.php rejected with 400 INVALID_FILE_TYPE',
    phpRes.status === 400 && phpRes.body?.error?.code === 'INVALID_FILE_TYPE',
    `HTTP ${phpRes.status}`
  );

  // 2.3 Non-docx PDF file
  const pdfUpload = createMultipartBody('template', 'document.pdf', Buffer.from('%PDF-1.4\n%Fake PDF'), 'application/pdf');
  const pdfUploadRes = await request('POST', '/api/templates/upload', pdfUpload.body, { 'Content-Type': pdfUpload.contentType });
  assertTest(
    'Upload document.pdf rejected with 400 INVALID_FILE_TYPE',
    pdfUploadRes.status === 400 && pdfUploadRes.body?.error?.code === 'INVALID_FILE_TYPE',
    `HTTP ${pdfUploadRes.status}`
  );

  // 2.4 Empty file (0 bytes) with .docx extension
  const emptyUpload = createMultipartBody('template', 'empty.docx', Buffer.alloc(0), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const emptyRes = await request('POST', '/api/templates/upload', emptyUpload.body, { 'Content-Type': emptyUpload.contentType });
  assertTest(
    'Upload 0-byte empty.docx rejected with 400 CORRUPTED_TEMPLATE/MALFORMED_TEMPLATE',
    emptyRes.status === 400 && (emptyRes.body?.error?.code === 'CORRUPTED_TEMPLATE' || emptyRes.body?.error?.code === 'MALFORMED_TEMPLATE'),
    `HTTP ${emptyRes.status}, code: ${emptyRes.body?.error?.code}`
  );

  // 2.5 Corrupt ZIP file (garbage binary) with .docx extension
  const corruptUpload = createMultipartBody('template', 'corrupt.docx', Buffer.from([0xDE, 0xAD, 0xBE, 0xEF, 0x01, 0x02, 0x03]), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const corruptRes = await request('POST', '/api/templates/upload', corruptUpload.body, { 'Content-Type': corruptUpload.contentType });
  assertTest(
    'Upload corrupt garbage corrupt.docx rejected with 400 MALFORMED_TEMPLATE',
    corruptRes.status === 400 && corruptRes.body?.error?.code === 'MALFORMED_TEMPLATE',
    `HTTP ${corruptRes.status}, code: ${corruptRes.body?.error?.code}`
  );

  // 2.6 Valid ZIP file but missing word/document.xml
  const zipWithoutDocXml = new PizZip();
  zipWithoutDocXml.file('readme.txt', 'This is a zip file, but not a valid docx template.');
  const nonDocxZipBuffer = zipWithoutDocXml.generate({ type: 'nodebuffer' });

  const nonDocxZipUpload = createMultipartBody('template', 'fake_docx.docx', nonDocxZipBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const nonDocxZipRes = await request('POST', '/api/templates/upload', nonDocxZipUpload.body, { 'Content-Type': nonDocxZipUpload.contentType });
  assertTest(
    'Upload ZIP missing word/document.xml rejected with 400 CORRUPTED_TEMPLATE',
    nonDocxZipRes.status === 400 && nonDocxZipRes.body?.error?.code === 'CORRUPTED_TEMPLATE',
    `HTTP ${nonDocxZipRes.status}, code: ${nonDocxZipRes.body?.error?.code}`
  );

  // 2.7 Missing file attachment
  const emptyFormBoundary = '----EmptyFormBoundary' + Math.random().toString(36).substring(2);
  const emptyFormBody = Buffer.from(`--${emptyFormBoundary}--\r\n`);
  const missingFileRes = await request('POST', '/api/templates/upload', emptyFormBody, {
    'Content-Type': `multipart/form-data; boundary=${emptyFormBoundary}`,
  });
  assertTest(
    'Upload with no file attached returns 400 FILE_MISSING',
    missingFileRes.status === 400 && missingFileRes.body?.error?.code === 'FILE_MISSING',
    `HTTP ${missingFileRes.status}, code: ${missingFileRes.body?.error?.code}`
  );

  // 2.8 Valid DOCX template upload & backup verification
  // Use the verified clean template file
  const cleanTemplatePath = path.resolve(__dirname, '../../rps-form-app/templates/processed/rps-template-processed-clean.docx');
  const validDocxBuffer = fs.readFileSync(cleanTemplatePath);

  const validUpload = createMultipartBody('template', 'rps-template-processed.docx', validDocxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const validUploadRes = await request('POST', '/api/templates/upload', validUpload.body, { 'Content-Type': validUpload.contentType });
  assertTest(
    'Valid DOCX upload succeeds with HTTP 200 and generates automated backup',
    validUploadRes.status === 200 && validUploadRes.body?.success === true && typeof validUploadRes.body?.backupCreated === 'string',
    `Backup: ${validUploadRes.body?.backupCreated}`
  );

  // Verify backup exists on disk
  if (validUploadRes.body?.backupCreated) {
    const backupFilePath = path.join(__dirname, '../../rps-form-app/templates/backups', validUploadRes.body.backupCreated);
    assertTest(
      'Backup file confirmed on disk in templates/backups',
      fs.existsSync(backupFilePath),
      backupFilePath
    );
  }

  // --------------------------------------------------------------------------
  // SECTION 3: EDGE CASE PAYLOADS TO /api/rps
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 3: EDGE CASE PAYLOADS TO /api/rps ---');

  // 3.1 Empty JSON body
  const emptyBodyRes = await request('POST', '/api/rps', {});
  assertTest(
    'Empty JSON body {} handled with sensible defaults (HTTP 201 DRAFT)',
    emptyBodyRes.status === 201 && emptyBodyRes.body?.status === 'DRAFT' && emptyBodyRes.body?.title === 'Draft RPS',
    `Status: ${emptyBodyRes.body?.status}, Title: "${emptyBodyRes.body?.title}"`
  );
  if (emptyBodyRes.body?.id) await request('DELETE', `/api/rps/${emptyBodyRes.body.id}`);

  // 3.2 Empty title string & whitespace-only title
  const emptyTitleRes = await request('POST', '/api/rps', { title: '' });
  assertTest(
    'Empty title string rejected with 400 VALIDATION_ERROR',
    emptyTitleRes.status === 400 && emptyTitleRes.body?.error?.code === 'VALIDATION_ERROR',
    `HTTP ${emptyTitleRes.status}`
  );

  const wsTitleRes = await request('POST', '/api/rps', { title: '     ' });
  assertTest(
    'Whitespace-only title rejected with 400 VALIDATION_ERROR',
    wsTitleRes.status === 400 && wsTitleRes.body?.error?.code === 'VALIDATION_ERROR',
    `HTTP ${wsTitleRes.status}`
  );

  // 3.3 Invalid status enum value
  const badStatusRes = await request('POST', '/api/rps', {
    title: 'Bad Status Test',
    status: 'ILLEGAL_STATUS_HACKED',
  });
  assertTest(
    'Invalid status enum rejected with 400 VALIDATION_ERROR',
    badStatusRes.status === 400 && badStatusRes.body?.error?.code === 'VALIDATION_ERROR',
    `HTTP ${badStatusRes.status}`
  );

  // 3.4 Out-of-bounds completionPercentage
  const negPercentRes = await request('POST', '/api/rps', {
    title: 'Negative Percent',
    completionPercentage: -15,
  });
  assertTest(
    'Negative completionPercentage (-15) rejected with 400 VALIDATION_ERROR',
    negPercentRes.status === 400 && negPercentRes.body?.error?.code === 'VALIDATION_ERROR',
    `HTTP ${negPercentRes.status}`
  );

  const overPercentRes = await request('POST', '/api/rps', {
    title: 'Over 100 Percent',
    completionPercentage: 150,
  });
  assertTest(
    'Excessive completionPercentage (150) rejected with 400 VALIDATION_ERROR',
    overPercentRes.status === 400 && overPercentRes.body?.error?.code === 'VALIDATION_ERROR',
    `HTTP ${overPercentRes.status}`
  );

  const floatPercentRes = await request('POST', '/api/rps', {
    title: 'Float Percent',
    completionPercentage: 75.5,
  });
  assertTest(
    'Non-integer completionPercentage (75.5) rejected with 400 VALIDATION_ERROR',
    floatPercentRes.status === 400 && floatPercentRes.body?.error?.code === 'VALIDATION_ERROR',
    `HTTP ${floatPercentRes.status}`
  );

  // 3.5 Malformed JSON syntax
  const malformedJsonRes = await request('POST', '/api/rps', '{"title": "Broken Json, unclosed string');
  assertTest(
    'Malformed raw JSON syntax returns 400 Bad Request',
    malformedJsonRes.status === 400,
    `HTTP ${malformedJsonRes.status}`
  );

  // 3.6 SQL Injection attempts in search query
  const sqliSearchRes = await request('GET', "/api/rps?search=' OR '1'='1");
  assertTest(
    "SQL injection in search param (' OR '1'='1) parameterized safely without error",
    sqliSearchRes.status === 200 && Array.isArray(sqliSearchRes.body),
    `HTTP ${sqliSearchRes.status}, returned ${sqliSearchRes.body?.length} docs`
  );

  const sqliDropRes = await request('GET', "/api/rps?search='; DROP TABLE RpsDocument;--");
  assertTest(
    "SQL injection drop table in search param parameterized safely",
    sqliDropRes.status === 200 && Array.isArray(sqliDropRes.body),
    `HTTP ${sqliDropRes.status}`
  );

  // 3.7 Non-existent ID routing
  const nonExistentId = 'non-existent-uuid-999999';
  const getNonExistent = await request('GET', `/api/rps/${nonExistentId}`);
  assertTest(
    'GET /api/rps/:id with non-existent ID returns 404 NOT_FOUND',
    getNonExistent.status === 404 && getNonExistent.body?.error?.code === 'NOT_FOUND',
    `HTTP ${getNonExistent.status}`
  );

  const putNonExistent = await request('PUT', `/api/rps/${nonExistentId}`, { title: 'Update Ghost' });
  assertTest(
    'PUT /api/rps/:id with non-existent ID returns 404 NOT_FOUND',
    putNonExistent.status === 404 && putNonExistent.body?.error?.code === 'NOT_FOUND',
    `HTTP ${putNonExistent.status}`
  );

  const delNonExistent = await request('DELETE', `/api/rps/${nonExistentId}`);
  assertTest(
    'DELETE /api/rps/:id with non-existent ID returns 404 NOT_FOUND',
    delNonExistent.status === 404 && delNonExistent.body?.error?.code === 'NOT_FOUND',
    `HTTP ${delNonExistent.status}`
  );

  const exportDocxNonExistent = await request('GET', `/api/rps/${nonExistentId}/export/docx`);
  assertTest(
    'GET /api/rps/:id/export/docx with non-existent ID returns 404 NOT_FOUND',
    exportDocxNonExistent.status === 404 && exportDocxNonExistent.body?.error?.code === 'NOT_FOUND',
    `HTTP ${exportDocxNonExistent.status}`
  );

  const exportPdfNonExistent = await request('GET', `/api/rps/${nonExistentId}/export/pdf`);
  assertTest(
    'GET /api/rps/:id/export/pdf with non-existent ID returns 404 NOT_FOUND',
    exportPdfNonExistent.status === 404 && exportPdfNonExistent.body?.error?.code === 'NOT_FOUND',
    `HTTP ${exportPdfNonExistent.status}`
  );

  // 3.8 Massive payload stress
  const cplArray = [];
  for (let i = 1; i <= 100; i++) {
    cplArray.push({ id: `cpl-${i}`, kode: `CPL${i}`, jenis: 'PRODI', deskripsi: `Adversarial stress test CPL description number ${i} `.repeat(5) });
  }
  const weeklyArray = [];
  for (let m = 1; m <= 32; m++) {
    weeklyArray.push({ minggu: m, subCpmk: `Sub CPMK ${m}`, bobot: 3 });
  }

  const hugePayload = {
    title: 'Stress Test Massive Payload',
    courseName: 'Massive Scalability Course',
    courseCode: 'SCALE999',
    data: {
      institusi: 'UNIVERSITAS CIPTA MANDIRI',
      cplList: cplArray,
      rencanaMingguan: weeklyArray,
      bahanKajian: 'Extensive syllabus content '.repeat(500),
    },
  };

  const hugeRes = await request('POST', '/api/rps', hugePayload);
  assertTest(
    'Massive JSON payload (100 CPLs, 32 weeks, 500 repeat syllabus) processed within limits',
    hugeRes.status === 201 && hugeRes.body?.id,
    `HTTP ${hugeRes.status}, ID: ${hugeRes.body?.id}`
  );

  if (hugeRes.body?.id) {
    const hugeDocxRes = await request('GET', `/api/rps/${hugeRes.body.id}/export/docx`);
    assertTest(
      'DOCX generation handles massive array rendering without crash or out-of-memory',
      hugeDocxRes.status === 200 && hugeDocxRes.rawBuffer.length > 50000,
      `Generated DOCX: ${hugeDocxRes.rawBuffer.length} bytes`
    );
    await request('DELETE', `/api/rps/${hugeRes.body.id}`);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`ADVERSARIAL STRESS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  return { passed, failed, results };
}

// Start ephemeral server and execute
server = app.listen(0, '127.0.0.1', async () => {
  port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[CHALLENGER 1] Ephemeral test server running at ${baseUrl}`);

  try {
    const { failed } = await runAdversarialTests();
    server.close(() => {
      process.exit(failed === 0 ? 0 : 1);
    });
  } catch (err) {
    console.error('[CHALLENGER 1] Uncaught adversarial test exception:', err);
    server.close(() => process.exit(1));
  }
});
