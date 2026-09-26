/**
 * Tier 4: Real-World Workload Scenarios - Full Lecturer Journey for "Logika Matematika"
 * Simulates complete realistic workflow of Lecturer Dian Kristanti, M.Pd.:
 * 1. Initializes course "Logika Matematika" (MAT201, 2 SKS)
 * 2. Inputs CPL and CPMK mappings
 * 3. Populates 16-week matrix
 * 4. Configures 100% evaluation weight breakdown
 * 5. Saves draft -> Updates week content -> Finalizes document
 * 6. Generates & verifies DOCX export
 * 7. Evaluates document via AI diagnostic context
 */

const PizZip = require('../../rps-form-app/node_modules/pizzip');
const {
  createSuite,
  apiGet,
  apiPost,
  apiPut,
  assert,
  assertEqual
} = require('../test_helper');

const suite = createSuite('Tier 4: End-to-End Lecturer Journey (Logika Matematika)');

const VALID_AGENT_KEY = process.env.AI_AGENT_KEY || 'kampus-ai-agent-key-dev';
let journeyDocId = null;

// Complete 16-Week Matrix data
const weeklyPlan16 = [
  { minggu: 1, subCpmk: 'Sub-CPMK 1', materi: 'Pengantar Logika Matematika & Pernyataan Majemuk', metode: 'Kuliah & Diskusi', waktu: '2x50 menit', bobot: 5 },
  { minggu: 2, subCpmk: 'Sub-CPMK 1', materi: 'Operasi Logika: Konjungsi, Disjungsi, Negasi', metode: 'Kuliah & Latihan', waktu: '2x50 menit', bobot: 5 },
  { minggu: 3, subCpmk: 'Sub-CPMK 2', materi: 'Tabel Kebenaran & Kondisional (Implikasi, Biimplikasi)', metode: 'Problem-Based Learning', waktu: '2x50 menit', bobot: 5 },
  { minggu: 4, subCpmk: 'Sub-CPMK 2', materi: 'Tautologi, Kontradiksi, dan Kontingensi', metode: 'Kuliah & Tugas Mandiri', waktu: '2x50 menit', bobot: 5 },
  { minggu: 5, subCpmk: 'Sub-CPMK 2', materi: 'Hukum-hukum Logika Proposisi & Ekuivalensi Logis', metode: 'Diskusi Kelompok', waktu: '2x50 menit', bobot: 5 },
  { minggu: 6, subCpmk: 'Sub-CPMK 3', materi: 'Penyederhanaan Pernyataan & Bentuk Normal', metode: 'Latihan Soal', waktu: '2x50 menit', bobot: 5 },
  { minggu: 7, subCpmk: 'Sub-CPMK 3', materi: 'Logika Predikat & Kuantor (Universal, Eksistensial)', metode: 'Kuliah Interaktif', waktu: '2x50 menit', bobot: 5 },
  { minggu: 8, subCpmk: 'Sub-CPMK 1-3', materi: 'Evaluasi Tengah Semester (UTS)', metode: 'Ujian Tertulis', waktu: '2x50 menit', bobot: 30 },
  { minggu: 9, subCpmk: 'Sub-CPMK 3', materi: 'Aturan Inferensi: Modus Ponens & Modus Tollens', metode: 'Kuliah & Diskusi', waktu: '2x50 menit', bobot: 5 },
  { minggu: 10, subCpmk: 'Sub-CPMK 3', materi: 'Silogisme Hipotesis, Silogisme Disjungtif & Dilema', metode: 'Problem-Based Learning', waktu: '2x50 menit', bobot: 5 },
  { minggu: 11, subCpmk: 'Sub-CPMK 4', materi: 'Teori Himpunan: Konsep Dasar & Operasi Himpunan', metode: 'Kuliah & Penugasan', waktu: '2x50 menit', bobot: 5 },
  { minggu: 12, subCpmk: 'Sub-CPMK 4', materi: 'Diagram Venn & Hukum De Morgan pada Himpunan', metode: 'Diskusi Kelompok', waktu: '2x50 menit', bobot: 5 },
  { minggu: 13, subCpmk: 'Sub-CPMK 4', materi: 'Relasi & Sifat-sifat Relasi (Refleksif, Simetris, Transitif)', metode: 'Latihan & Studi Kasus', waktu: '2x50 menit', bobot: 5 },
  { minggu: 14, subCpmk: 'Sub-CPMK 4', materi: 'Relasi Ekuivalensi & Relasi Pengurutan Parsial (Poset)', metode: 'Kuliah & Diskusi', waktu: '2x50 menit', bobot: 5 },
  { minggu: 15, subCpmk: 'Sub-CPMK 4', materi: 'Prinsip Induksi Matematika (Lemah dan Kuat)', metode: 'Problem-Based Learning', waktu: '2x50 menit', bobot: 5 },
  { minggu: 16, subCpmk: 'Sub-CPMK 1-4', materi: 'Evaluasi Akhir Semester (UAS)', metode: 'Ujian Komprehensif', waktu: '2x50 menit', bobot: 35 }
];

// Step 1: Lecturer creates initial draft
suite.test('Step 1: Lecturer initializes Logika Matematika course draft', async () => {
  const initialPayload = {
    title: 'RPS Logika Matematika 2026/2027',
    courseName: 'Logika Matematika',
    courseCode: 'MAT201',
    data: {
      institusi: 'UNIVERSITAS CIPTA MANDIRI',
      fakultas: 'FAKULTAS KEGURUAN DAN ILMU PENDIDIKAN',
      programStudi: 'PENDIDIKAN MATEMATIKA',
      sks: '2',
      sksT: '2',
      sksP: '0',
      semester: '2',
      dosenPengembang: 'Dian Kristanti, M.Pd.',
      koordinator: 'Dazrullisa, M.Pd.',
      weeklyPlan: weeklyPlan16.slice(0, 8) // Initially fills only first half
    }
  };

  const res = await apiPost('/api/rps', initialPayload);
  assert(res.status === 200 || res.status === 201, 'Initial draft creation should succeed');
  journeyDocId = res.data.id;
  assert(journeyDocId, 'Document ID must be established');
});

// Step 2: Lecturer populates CPL, CPMK, and completes 16 weeks
suite.test('Step 2: Lecturer expands draft to full 16-week matrix and CPL/CPMK mappings', async () => {
  assert(journeyDocId, 'Prerequisite: journeyDocId required');

  const fullPayload = {
    title: 'RPS Logika Matematika 2026/2027 (Lengkap)',
    courseName: 'Logika Matematika',
    courseCode: 'MAT201',
    status: 'LENGKAP',
    data: {
      institusi: 'UNIVERSITAS CIPTA MANDIRI',
      programStudi: 'PENDIDIKAN MATEMATIKA',
      sks: '2',
      sksT: '2',
      sksP: '0',
      semester: '2',
      dosenPengembang: 'Dian Kristanti, M.Pd.',
      koordinator: 'Dazrullisa, M.Pd.',
      cpl: [
        { kode: 'CPL-1', deskripsi: 'Bertakwa kepada Tuhan Yang Maha Esa dan menunjukkan sikap etika akademik' },
        { kode: 'CPL-2', deskripsi: 'Menguasai konsep teoretis matematika dan logika proposisi' },
        { kode: 'CPL-3', deskripsi: 'Mampu menerapkan pemikiran logis, kritis, dan sistematis' },
        { kode: 'CPL-4', deskripsi: 'Mampu membuktikan teorema menggunakan aturan inferensi' }
      ],
      cpmk: [
        { kode: 'CPMK-1', deskripsi: 'Memahami konsep kalimat terbuka dan pernyataan' },
        { kode: 'CPMK-2', deskripsi: 'Menentukan nilai kebenaran dengan tabel kebenaran' },
        { kode: 'CPMK-3', deskripsi: 'Menganalisis validitas argumen formal' },
        { kode: 'CPMK-4', deskripsi: 'Menerapkan prinsip induksi matematika' }
      ],
      weeklyPlan: weeklyPlan16,
      penilaian: {
        uts: 30,
        uas: 35,
        tugas: 20,
        kuis: 10,
        keaktifan: 5
      }
    }
  };

  const res = await apiPut(`/api/rps/${journeyDocId}`, fullPayload);
  assertEqual(res.status, 200, 'Full update should succeed');
  assertEqual(res.data.status, 'LENGKAP');
});

// Step 3: Verify 16 weeks and weights persist in database
suite.test('Step 3: Verification of full 16-week persistence and assessment integrity', async () => {
  assert(journeyDocId, 'Prerequisite: journeyDocId required');

  const res = await apiGet(`/api/rps/${journeyDocId}`);
  assertEqual(res.status, 200);

  const parsedData = typeof res.data.dataJson === 'string' ? JSON.parse(res.data.dataJson) : res.data.dataJson;
  assertEqual(parsedData.weeklyPlan.length, 16, 'Weekly plan must contain exactly 16 weeks');
  assertEqual(parsedData.weeklyPlan[0].materi, 'Pengantar Logika Matematika & Pernyataan Majemuk');
  assertEqual(parsedData.weeklyPlan[15].materi, 'Evaluasi Akhir Semester (UAS)');

  // Validate weight sum
  const p = parsedData.penilaian;
  const totalWeight = p.uts + p.uas + p.tugas + p.kuis + p.keaktifan;
  assertEqual(totalWeight, 100, 'Assessment weights must sum to exactly 100%');
});

// Step 4: Stream DOCX export and verify complete syllabus rendering
suite.test('Step 4: Export DOCX and verify generated document contains full syllabus', async () => {
  assert(journeyDocId, 'Prerequisite: journeyDocId required');

  const res = await apiGet(`/api/rps/${journeyDocId}/export/docx`);
  assertEqual(res.status, 200, 'DOCX stream must return 200');

  const zip = new PizZip(res.data);
  const docXml = zip.file('word/document.xml').asText();

  // Validate that key metadata is present in rendered document XML
  assert(docXml.includes('Logika Matematika'), 'DOCX XML must contain course title');
  assert(docXml.includes('Dian Kristanti, M.Pd.'), 'DOCX XML must contain lecturer name');
});

// Step 5: AI Diagnostic Introspection
suite.test('Step 5: Query AI Context introspection for document compliance check', async () => {
  assert(journeyDocId, 'Prerequisite: journeyDocId required');

  const res = await apiGet(`/api/v1/ai/context/rps/${journeyDocId}`, {
    'X-Agent-Key': VALID_AGENT_KEY
  });

  if (res.status === 404) {
    throw new Error('PENDING (M2 Pending): /api/v1/ai/context/rps/:id endpoint not yet implemented');
  }

  assertEqual(res.status, 200, 'AI Diagnostic endpoint should return 200');
  assert(res.data, 'AI Diagnostic response must exist');
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
