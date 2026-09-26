/**
 * Milestone 1 Self-Verification Script
 * Tests all backend routes, security protections, DOCX exports, and error handling.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// Ensure test environment
process.env.NODE_ENV = 'test';

// Import compiled app
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
      headers: {
        ...headers,
      },
    };

    let payload = null;
    if (body && typeof body === 'object' && !(body instanceof Buffer)) {
      payload = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
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

async function runTests() {
  console.log('=== STARTING MILESTONE 1 VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health check
  console.log('1. Testing Health and Meta Endpoints:');
  const healthRes = await request('GET', '/api/health');
  assert(healthRes.status === 200 && healthRes.body.status === 'ok', 'GET /api/health returns status ok');

  const rootRes = await request('GET', '/');
  assert(rootRes.status === 200 && rootRes.body.status === 'running', 'GET / returns app metadata');

  // 2. Templates Endpoint
  console.log('\n2. Testing Template Metadata:');
  const tmplRes = await request('GET', '/api/templates');
  assert(tmplRes.status === 200 && tmplRes.body.exists === true, 'GET /api/templates reports active template');

  // 3. Document CRUD
  console.log('\n3. Testing RPS Document CRUD:');
  const listBefore = await request('GET', '/api/rps');
  assert(listBefore.status === 200 && Array.isArray(listBefore.body), 'GET /api/rps returns array of documents');

  // Create document
  const createPayload = {
    title: 'RPS Pengujian Otomatis M1',
    courseName: 'PENGUJIAN PERANGKAT LUNAK',
    courseCode: 'PPL301',
    data: {
      institusi: 'UNIVERSITAS CIPTA MANDIRI',
      programStudi: 'INFORMATIKA',
      sksT: 2,
      sksP: 1,
      sks: 3,
      semester: 5,
      dosenPengembang: 'Dr. Engineer M1',
      koordinatorMk: 'Prof. Tester M1',
      cplList: [{ id: '1', kode: 'CPL1', jenis: 'PRODI', deskripsi: 'Mampu merekayasa sistem' }],
      bahanKajian: 'Testing, QA, Automation',
      metodePembelajaran: { ceramah: true, diskusi: true, pjbl: true, cbl: false },
      rencanaMingguan: [{ minggu: 1, subCpmk: 'Dasar QA', bobot: 5 }],
      penilaian: [{ komponen: 'Tugas', bobot: 40 }, { komponen: 'UTS', bobot: 30 }, { komponen: 'UAS', bobot: 30 }],
      pustakaUtama: 'Software Engineering 10th Ed',
    },
  };

  const createRes = await request('POST', '/api/rps', createPayload);
  assert(createRes.status === 201 && createRes.body.id, 'POST /api/rps creates document with HTTP 201');
  assert(createRes.body.completionPercentage > 0, `Completion percentage calculated: ${createRes.body.completionPercentage}%`);
  const createdId = createRes.body.id;

  // Get document by ID
  const getRes = await request('GET', `/api/rps/${createdId}`);
  assert(getRes.status === 200 && getRes.body.courseCode === 'PPL301', 'GET /api/rps/:id retrieves created document');

  // Update document
  const updateRes = await request('PUT', `/api/rps/${createdId}`, {
    title: 'RPS Pengujian Otomatis M1 (Updated)',
    courseName: 'PENGUJIAN PERANGKAT LUNAK LANJUT',
    courseCode: 'PPL302',
    status: 'LENGKAP',
  });
  assert(updateRes.status === 200 && updateRes.body.courseCode === 'PPL302', 'PUT /api/rps/:id updates document');
  assert(updateRes.body.status === 'LENGKAP', 'Status updated to LENGKAP');

  // 4. DOCX Export
  console.log('\n4. Testing DOCX Export:');
  const docxRes = await request('GET', `/api/rps/${createdId}/export/docx`);
  assert(docxRes.status === 200, `GET /api/rps/:id/export/docx returns HTTP 200 (got ${docxRes.status})`);
  assert(
    docxRes.headers['content-type'] && docxRes.headers['content-type'].includes('officedocument.wordprocessingml'),
    'Content-Type is DOCX'
  );
  assert(docxRes.rawBuffer.length > 10000, `DOCX file received (${docxRes.rawBuffer.length} bytes)`);

  // Verify DOCX ZIP header (PK\x03\x04)
  const isZip = docxRes.rawBuffer[0] === 0x50 && docxRes.rawBuffer[1] === 0x4b;
  assert(isZip, 'DOCX file has valid ZIP binary header (PK)');

  // 5. PDF Export & Safe Command Execution
  console.log('\n5. Testing PDF Export & Safe Isolation:');
  const pdfRes = await request('GET', `/api/rps/${createdId}/export/pdf`);
  // On local machine without LibreOffice, it should return 503 LIBREOFFICE_NOT_FOUND without crashing
  if (pdfRes.status === 200) {
    assert(true, 'PDF export succeeded with HTTP 200 (LibreOffice installed)');
  } else {
    assert(
      pdfRes.status === 503 && pdfRes.body?.error?.code === 'LIBREOFFICE_NOT_FOUND',
      `Safe fallback when LibreOffice not in PATH: HTTP ${pdfRes.status}, code: ${pdfRes.body?.error?.code}`
    );
  }

  // 6. Security Sanitization Tests
  console.log('\n6. Testing Security Sanitization:');

  // 6a. Malicious courseCode with shell injection characters
  const injectionPayload = {
    title: 'Injection Test',
    courseName: 'Test MK',
    courseCode: 'PPL301"; rm -rf / ; #', // Shell metacharacters
    data: {},
  };
  const injectionRes = await request('POST', '/api/rps', injectionPayload);
  assert(
    injectionRes.status === 400 && injectionRes.body?.error?.code === 'VALIDATION_ERROR',
    'Shell injection in courseCode blocked by Zod validator with HTTP 400'
  );

  // 6b. Arbitrary template upload validation (must reject non-docx)
  // Construct simple multipart body for testing
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const badFileContent = Buffer.from('Malicious script content or executable binary');
  const multipartBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="template"; filename="exploit.exe"\r\nContent-Type: application/x-msdownload\r\n\r\n`),
    badFileContent,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const badUploadRes = await request('POST', '/api/templates/upload', multipartBody, {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
  });
  assert(
    badUploadRes.status === 400 && badUploadRes.body?.error?.code === 'INVALID_FILE_TYPE',
    `Non-docx file upload rejected with HTTP 400 (${badUploadRes.body?.error?.code})`
  );

  // 7. Clean up test document
  console.log('\n7. Cleaning Up Test Document:');
  const delRes = await request('DELETE', `/api/rps/${createdId}`);
  assert(delRes.status === 200 && delRes.body.success, 'DELETE /api/rps/:id deletes test document');

  // Verify deletion
  const getDeleted = await request('GET', `/api/rps/${createdId}`);
  assert(getDeleted.status === 404, 'Deleted document returns HTTP 404 NOT_FOUND');

  console.log(`\n=== VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  return failed === 0;
}

// Start ephemeral server and run tests
server = app.listen(0, '127.0.0.1', async () => {
  port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  try {
    const allPassed = await runTests();
    server.close(() => {
      process.exit(allPassed ? 0 : 1);
    });
  } catch (err) {
    console.error('Fatal test error:', err);
    server.close(() => process.exit(1));
  }
});
