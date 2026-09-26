/**
 * Tier 3: Cross-Feature Combinations - Draft Submission to DOCX Export Verification
 * Exercises full pipeline: Complex form data -> Database persistence -> DOCX export
 * stream -> Unzip DOCX and verify XML contents across pairwise combinations of SKS and Status.
 */

const PizZip = require('../../rps-form-app/node_modules/pizzip');
const {
  createSuite,
  apiPost,
  apiGet,
  apiPut,
  assert,
  assertEqual
} = require('../test_helper');

const suite = createSuite('Tier 3: Form Draft -> DB -> DOCX Stream Pipeline');

// Pairwise test matrix: SKS formats x Document Statuses
const testCases = [
  { sks: '2', sksT: '2', sksP: '0', status: 'DRAFT', courseName: 'Logika Dasar', code: 'LOG_2' },
  { sks: '3', sksT: '2', sksP: '1', status: 'LENGKAP', courseName: 'Aljabar Linear', code: 'ALJ_3' },
  { sks: '4', sksT: '3', sksP: '1', status: 'DIEKSPOR', courseName: 'Kalkulus Multivariat', code: 'KAL_4' }
];

for (const tc of testCases) {
  suite.test(`Pipeline flow: SKS ${tc.sks} with status ${tc.status} -> DOCX XML verification`, async () => {
    // 1. Submit rich RPS draft
    const payload = {
      title: `RPS ${tc.courseName}`,
      courseName: tc.courseName,
      courseCode: `${tc.code}_${Math.floor(Math.random() * 10000)}`,
      status: tc.status,
      data: {
        institusi: 'UNIVERSITAS CIPTA MANDIRI',
        programStudi: 'PENDIDIKAN MATEMATIKA',
        sks: tc.sks,
        sksT: tc.sksT,
        sksP: tc.sksP,
        dosenPengembang: 'Dian Kristanti, M.Pd.',
        koordinator: 'Dazrullisa, M.Pd.',
        cpl: [
          { kode: 'CPL-1', deskripsi: 'Mampu berpikir logis dan sistematis' },
          { kode: 'CPL-2', deskripsi: 'Mampu menyelesaikan masalah matematis' }
        ],
        cpmk: [
          { kode: 'CPMK-1', deskripsi: 'Menguasai konsep pembuktian logis' }
        ]
      }
    };

    const createRes = await apiPost('/api/rps', payload);
    assert(createRes.status === 200 || createRes.status === 201, 'Creation must succeed');
    const docId = createRes.data.id;
    assert(docId, 'Must return created doc ID');

    // 2. Verify DB persistence via GET
    const getRes = await apiGet(`/api/rps/${docId}`);
    assertEqual(getRes.status, 200, 'Document must be retrievable from DB');
    assertEqual(getRes.data.courseName, tc.courseName);

    // 3. Request DOCX export stream
    const exportRes = await apiGet(`/api/rps/${docId}/export/docx`);
    assertEqual(exportRes.status, 200, 'DOCX export stream must return 200 OK');
    assert(Buffer.isBuffer(exportRes.data), 'Export must return a binary buffer');

    // 4. Unpack DOCX and inspect word/document.xml
    const zip = new PizZip(exportRes.data);
    const docXml = zip.file('word/document.xml');
    assert(docXml !== null, 'DOCX must contain word/document.xml');

    const xmlText = docXml.asText();
    assert(
      xmlText.includes(tc.courseName),
      `word/document.xml must contain course name "${tc.courseName}"`
    );
    assert(
      xmlText.includes('UNIVERSITAS CIPTA MANDIRI'),
      'word/document.xml must contain institution name'
    );
  });
}

// Test pairwise update: Draft -> Edit Week -> Re-export DOCX
suite.test('Pipeline flow: Update existing draft and verify changes reflected in re-exported DOCX', async () => {
  const initialCode = 'REV_' + Math.floor(Math.random() * 10000);
  const createRes = await apiPost('/api/rps', {
    title: 'Initial Version',
    courseName: 'Statistika Dasar',
    courseCode: initialCode,
    data: { institusi: 'UNIVERSITAS CIPTA MANDIRI', dosenPengembang: 'Dr. Ahmad' }
  });
  const docId = createRes.data.id;

  // Update lecturer name
  const updatedLecturer = 'Prof. Budi Santoso, Ph.D.';
  await apiPut(`/api/rps/${docId}`, {
    title: 'Revised Version',
    courseName: 'Statistika Matematika',
    courseCode: initialCode,
    data: { institusi: 'UNIVERSITAS CIPTA MANDIRI', dosenPengembang: updatedLecturer }
  });

  // Re-export DOCX
  const exportRes = await apiGet(`/api/rps/${docId}/export/docx`);
  assertEqual(exportRes.status, 200);

  const zip = new PizZip(exportRes.data);
  const xmlText = zip.file('word/document.xml').asText();
  assert(
    xmlText.includes(updatedLecturer) || xmlText.includes('Statistika Matematika'),
    'Re-exported DOCX must contain updated lecturer or course name'
  );
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
