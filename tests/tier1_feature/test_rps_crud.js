/**
 * Tier 1: Feature Coverage - RPS CRUD Operations
 * Tests create, read, update, list, and 404 error handling for RPS documents.
 */

const {
  createSuite,
  apiGet,
  apiPost,
  apiPut,
  assert,
  assertEqual,
  assertIncludes
} = require('../test_helper');

const suite = createSuite('Tier 1: RPS CRUD Operations');

let createdDocId = null;
const uniqueCode = 'MATH_' + Math.floor(Math.random() * 100000);

// Test 1: Create RPS Document
suite.test('POST /api/rps should create a new RPS document with DRAFT status', async () => {
  const payload = {
    title: 'RPS Logika Matematika Test',
    courseName: 'Logika Matematika',
    courseCode: uniqueCode,
    data: {
      sks: '2',
      semester: '2',
      programStudi: 'Pendidikan Matematika',
      dosenPengembang: 'Dian Kristanti, M.Pd.'
    }
  };

  const res = await apiPost('/api/rps', payload);
  assert(res.status === 200 || res.status === 201, `Expected 200 or 201 on RPS creation, got ${res.status}`);
  assert(res.data && res.data.id, 'Expected response to contain created document ID');
  assertEqual(res.data.courseCode, uniqueCode, 'Course code should match input');
  assertEqual(res.data.status, 'DRAFT', 'Default document status should be DRAFT');

  createdDocId = res.data.id;
});

// Test 2: Read RPS Document by ID
suite.test('GET /api/rps/:id should retrieve the created RPS document', async () => {
  assert(createdDocId, 'Prerequisite: createdDocId must exist');

  const res = await apiGet(`/api/rps/${createdDocId}`);
  assertEqual(res.status, 200, 'Expected 200 OK on retrieving document');
  assertEqual(res.data.id, createdDocId, 'Document ID should match');
  assertEqual(res.data.courseCode, uniqueCode, 'Course code should match');

  // Verify nested dataJson
  const parsedData = typeof res.data.dataJson === 'string' ? JSON.parse(res.data.dataJson) : res.data.dataJson;
  assertEqual(parsedData.programStudi, 'Pendidikan Matematika', 'Parsed dataJson should contain programStudi');
  assertEqual(parsedData.dosenPengembang, 'Dian Kristanti, M.Pd.', 'Parsed dataJson should contain dosenPengembang');
});

// Test 3: Update RPS Document
suite.test('PUT /api/rps/:id should update existing RPS document metadata and content', async () => {
  assert(createdDocId, 'Prerequisite: createdDocId must exist');

  const updatePayload = {
    title: 'RPS Logika Matematika Final Revisi',
    courseName: 'Logika Matematika Lanjut',
    courseCode: uniqueCode,
    status: 'LENGKAP',
    data: {
      sks: '3',
      semester: '2',
      programStudi: 'Pendidikan Matematika',
      dosenPengembang: 'Dian Kristanti, M.Pd.',
      koordinator: 'Dazrullisa, M.Pd.'
    }
  };

  const res = await apiPut(`/api/rps/${createdDocId}`, updatePayload);
  assertEqual(res.status, 200, 'Expected 200 OK on document update');
  assertEqual(res.data.title, 'RPS Logika Matematika Final Revisi', 'Updated title should match');
  assertEqual(res.data.courseName, 'Logika Matematika Lanjut', 'Updated courseName should match');
  assertEqual(res.data.status, 'LENGKAP', 'Updated status should be LENGKAP');

  const parsedData = typeof res.data.dataJson === 'string' ? JSON.parse(res.data.dataJson) : res.data.dataJson;
  assertEqual(parsedData.koordinator, 'Dazrullisa, M.Pd.', 'Updated koordinator should match');
});

// Test 4: List RPS Documents
suite.test('GET /api/rps should list all RPS documents including the created one', async () => {
  assert(createdDocId, 'Prerequisite: createdDocId must exist');

  const res = await apiGet('/api/rps');
  assertEqual(res.status, 200, 'Expected 200 OK on listing RPS documents');
  assert(Array.isArray(res.data), 'Expected response to be an array of documents');

  const found = res.data.find(d => d.id === createdDocId);
  assert(found !== undefined, 'Created document should be present in the listing');
  assertEqual(found.courseCode, uniqueCode, 'Found document courseCode should match');
});

// Test 5: 404 for Non-Existent RPS Document
suite.test('GET /api/rps/:id with non-existent ID should return 404 Not Found', async () => {
  const fakeId = 'non-existent-uuid-9999-9999';
  const res = await apiGet(`/api/rps/${fakeId}`);
  assertEqual(res.status, 404, 'Expected 404 Not Found for non-existent ID');
  assert(res.data && (res.data.error || res.data.message), 'Response should provide an error message');
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
