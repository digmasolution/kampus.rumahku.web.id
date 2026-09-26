/**
 * Tier 1: Feature Coverage - Export & Template Endpoints
 * Tests DOCX generation, PDF export handling, template file integrity, and template upload.
 */

const fs = require('fs');
const path = require('path');
const PizZip = require('../../rps-form-app/node_modules/pizzip');
const {
  createSuite,
  apiGet,
  apiPost,
  apiUpload,
  assert,
  assertEqual,
  assertIncludes,
  RPS_APP_DIR
} = require('../test_helper');

const suite = createSuite('Tier 1: Export & Template Endpoints');

let testRpsId = null;

// Setup: Create a test document to export
suite.test('Setup: Create RPS document for export testing', async () => {
  const res = await apiPost('/api/rps', {
    title: 'Export Test RPS',
    courseName: 'Logika Matematika Export',
    courseCode: 'EXP_101',
    data: {
      institusi: 'UNIVERSITAS CIPTA MANDIRI',
      programStudi: 'PENDIDIKAN MATEMATIKA',
      sks: '2',
      sksT: '2',
      sksP: '0',
      tanggal: '24/09/2026',
      dosenPengembang: 'Dian Kristanti, M.Pd.',
      koordinator: 'Dazrullisa, M.Pd.'
    }
  });

  assert(res.status === 200 || res.status === 201, 'Setup RPS should be created successfully');
  testRpsId = res.data.id;
  assert(testRpsId, 'testRpsId must be defined');
});

// Test 1: DOCX Export returns valid OpenXML Word document
suite.test('GET /api/rps/:id/export/docx should return valid DOCX stream with PK zip header', async () => {
  assert(testRpsId, 'Prerequisite: testRpsId must exist');

  const res = await apiGet(`/api/rps/${testRpsId}/export/docx`);
  assertEqual(res.status, 200, 'Expected 200 OK for DOCX export');

  assert(Buffer.isBuffer(res.data), 'Export response data must be a binary Buffer');
  assert(res.data.length > 5000, `Exported DOCX buffer must be substantial (size: ${res.data.length} bytes)`);

  // Verify PK zip header signature: 0x50 0x4B 0x03 0x04
  const isZip = res.data[0] === 0x50 && res.data[1] === 0x4B && res.data[2] === 0x03 && res.data[3] === 0x04;
  assert(isZip, 'Exported DOCX must have valid PK Zip header signature (0x504B0304)');

  // Verify DOCX internal structure using PizZip
  const zip = new PizZip(res.data);
  const contentTypes = zip.file('[Content_Types].xml');
  assert(contentTypes !== null, 'DOCX zip archive must contain [Content_Types].xml');

  const documentXml = zip.file('word/document.xml');
  assert(documentXml !== null, 'DOCX zip archive must contain word/document.xml');

  const docText = documentXml.asText();
  assert(
    docText.includes('Logika Matematika Export') || docText.includes('EXP_101'),
    'Generated DOCX word/document.xml must contain the course name or course code'
  );
});

// Test 2: DOCX Export for non-existent document returns 404
suite.test('GET /api/rps/:id/export/docx with non-existent ID should return 404', async () => {
  const fakeId = 'non-existent-export-uuid-0000';
  const res = await apiGet(`/api/rps/${fakeId}/export/docx`);
  assertEqual(res.status, 404, 'Expected 404 for non-existent document export');
});

// Test 3: Template File Integrity in templates/processed/
suite.test('Active processed template file must exist and contain valid placeholder tags', async () => {
  const templatePath = path.join(RPS_APP_DIR, 'templates/processed/rps-template-processed.docx');
  assert(fs.existsSync(templatePath), `Processed template must exist at ${templatePath}`);

  const stat = fs.statSync(templatePath);
  assert(stat.size > 10000, `Template file size should be > 10KB (actual: ${stat.size} bytes)`);

  const fileContent = fs.readFileSync(templatePath);
  const zip = new PizZip(fileContent);
  const documentXml = zip.file('word/document.xml');
  assert(documentXml !== null, 'Template must contain word/document.xml');

  const text = documentXml.asText();
  // Check for presence of template tags
  const hasTags = text.includes('INSTITUSI') || text.includes('NAMA_MATA_KULIAH') || text.includes('KODE_MATA_KULIAH');
  assert(hasTags, 'Template document.xml must contain standard RPS placeholder markers');
});

// Test 4: Template Upload Endpoint
suite.test('POST /api/templates/upload should accept valid DOCX template file', async () => {
  const templateSourcePath = path.join(RPS_APP_DIR, 'templates/processed/rps-template-processed.docx');
  assert(fs.existsSync(templateSourcePath), 'Template source must exist for upload test');

  const templateBuffer = fs.readFileSync(templateSourcePath);
  const res = await apiUpload(
    '/api/templates/upload',
    'template',
    'test-template.docx',
    templateBuffer,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );

  assertEqual(res.status, 200, 'Expected 200 OK for valid template upload');
  assert(res.data && (res.data.success === true || res.data.message), 'Response should confirm template upload success');
});

// Test 5: PDF Export Endpoint Handling
suite.test('GET /api/rps/:id/export/pdf should handle PDF conversion appropriately', async () => {
  assert(testRpsId, 'Prerequisite: testRpsId must exist');

  // Trigger export endpoint
  const res = await apiGet(`/api/rps/${testRpsId}/export/pdf`);

  // Either 200 (if LibreOffice is installed and converted) or 500 with LibreOffice error / 400 please export docx first
  if (res.status === 200) {
    assert(Buffer.isBuffer(res.data), 'PDF response must be binary');
    const header = res.data.slice(0, 4).toString('utf-8');
    assertEqual(header, '%PDF', 'PDF response must begin with %PDF header');
  } else {
    // Graceful error handling verification (503 if LibreOffice is not installed, 400 if export docx required first, 500 on conversion failure)
    assert(
      res.status === 400 || res.status === 500 || res.status === 503,
      `Expected 400, 500, or 503 for PDF export without headless office daemon (got ${res.status})`
    );
    assert(
      res.data && (res.data.error || res.data.message),
      'Error response must contain descriptive error message'
    );
  }
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
