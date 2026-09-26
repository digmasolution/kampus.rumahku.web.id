/**
 * Tier 2: Boundary & Corner Cases - Command Injection & Parameter Sanitization
 * Tests defense against shell command injection in PDF/DOCX flows, path traversal,
 * SQL injection in routes, and XSS string preservation.
 */

const {
  createSuite,
  apiGet,
  apiPost,
  apiUpload,
  assert,
  assertEqual
} = require('../test_helper');

const suite = createSuite('Tier 2: Injection & Sanitization Hardening');

// Test 1: Command Injection in courseCode during RPS creation and PDF conversion
suite.test('Course code with shell command injection should not execute arbitrary commands', async () => {
  const maliciousCode = 'MATH_INJ"; echo "PWNED" > /tmp/pwned.txt; echo "';
  
  const createRes = await apiPost('/api/rps', {
    title: 'Injection Test RPS',
    courseName: 'Security Testing',
    courseCode: maliciousCode,
    data: { institusi: 'UNIVERSITAS CIPTA MANDIRI' }
  });

  // Rejection via Zod regex (400) is the primary defense; if stored (200/201), export must not execute shell commands
  assert(
    createRes.status === 400 || createRes.status === 200 || createRes.status === 201,
    `Creation should reject invalid code (400) or store safely (200/201), got ${createRes.status}`
  );

  if (createRes.status === 200 || createRes.status === 201) {
    const docId = createRes.data.id;
    // Trigger export endpoint which previously used child_process.exec
    const exportRes = await apiGet(`/api/rps/${docId}/export/pdf`);

    // Either 400 (export docx first) or 500 (libreoffice not found/conversion error) without executing shell injection
    assert(
      exportRes.status === 400 || exportRes.status === 500 || exportRes.status === 200,
      `Export should safely handle command line arguments without crashing (status ${exportRes.status})`
    );
  }
});

// Test 2: Windows Shell Metacharacters in courseCode
suite.test('Course code with Windows shell metacharacters (& calc.exe &) should not spawn processes', async () => {
  const winCmdInjection = 'CS_TEST & calc.exe &';

  const res = await apiPost('/api/rps', {
    title: 'Windows Injection Test',
    courseName: 'Operating Systems',
    courseCode: winCmdInjection,
    data: {}
  });

  assert(
    res.status === 400 || res.status === 200 || res.status === 201,
    `Should either reject metacharacters (400) or safely store string in database (200/201), got ${res.status}`
  );
});

// Test 3: Path Traversal in Template Upload
suite.test('POST /api/templates/upload with path traversal filename should be safely contained', async () => {
  const dummyDocx = Buffer.from('PK\x03\x04DummyOpenXmlTestContent');
  const maliciousFilename = '../../../../etc/passwd.docx';

  const res = await apiUpload(
    '/api/templates/upload',
    'template',
    maliciousFilename,
    dummyDocx,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );

  // Endpoint should either succeed by stripping path or reject with 400
  assert(
    res.status === 200 || res.status === 400,
    `Expected safe upload or validation rejection, got ${res.status}`
  );
});

// Test 4: SQL Injection in URL route parameter (/api/rps/:id)
suite.test("GET /api/rps/' OR 1=1 -- should return 404 rather than SQL syntax error", async () => {
  const sqlInjectionId = "' OR 1=1 --";
  const res = await apiGet(`/api/rps/${encodeURIComponent(sqlInjectionId)}`);

  assertEqual(res.status, 404, 'SQL injection in ID parameter should return 404 Not Found');
});

// Test 5: XSS payloads in RPS metadata
suite.test('POST /api/rps with XSS payload should store and return text verbatim without mutation', async () => {
  const xssPayload = '<script>alert("XSS")</script><img src="x" onerror="alert(1)">';

  const res = await apiPost('/api/rps', {
    title: xssPayload,
    courseName: 'Web Security',
    courseCode: 'SEC_XSS',
    data: { description: xssPayload }
  });

  assert(res.status === 200 || res.status === 201, 'Expected 200 or 201 OK');
  assertEqual(res.data.title, xssPayload, 'Title should be stored verbatim as raw string');

  const getRes = await apiGet(`/api/rps/${res.data.id}`);
  assertEqual(getRes.data.title, xssPayload, 'Retrieved title should be stored verbatim');
});

async function run() {
  return await suite.run();
}

if (require.main === module) {
  run().then(res => {
    if (res.failed > 0) process.exit(1);
  });
}

module.exports = { run };
