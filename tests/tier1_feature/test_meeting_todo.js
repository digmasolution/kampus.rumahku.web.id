/**
 * Tier 1: Feature Coverage - Meeting Notes & Todoist Kanban Features
 */

const {
  createSuite,
  apiGet,
  apiPost,
  apiPut,
  assert,
  assertEqual
} = require('../test_helper');

const suite = createSuite('Tier 1: Meeting Notes & Todoist Kanban');

let createdMeetingId = null;
let createdTodoId = null;

// Test 1: Autocomplete Users endpoint for @mentions
suite.test('GET /api/auth/users returns users list for mentions', async () => {
  const res = await apiGet('/api/auth/users');
  assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data), 'Expected array of users');
  assert(res.data.length > 0, 'Expected at least 1 user');
  assert(res.data[0].name, 'Expected user to have name property');
});

// Test 2: Preview parser endpoint for #tasks, @user, p1..p5, T1
suite.test('POST /api/meetings/preview-parse correctly parses tokens', async () => {
  const sampleText = `
    <p>Rapat persiapan semester:</p>
    <p>#Siapkan Silabus RPS @Dr._Budi_Santoso p1 T1:2026-10-01</p>
    <p>#Update Soal Ujian Tengah Semester p2</p>
  `;
  const res = await apiPost('/api/meetings/preview-parse', { content: sampleText });
  assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data), 'Expected array of parsed todos');
  assertEqual(res.data.length, 2, 'Expected 2 extracted todos');

  const t1 = res.data[0];
  assert(t1.title.includes('Siapkan Silabus RPS'), 'Task title should match');
  assertEqual(t1.priority, 'P1', 'Task priority should be P1');
  assertEqual(t1.assignedToName, 'Dr. Budi Santoso', 'Assignee should be parsed');
  assert(t1.dueDate, 'Due date should be parsed');

  const t2 = res.data[1];
  assertEqual(t2.priority, 'P2', 'Task priority should be P2');
});

// Test 3: Create Meeting Note and verify auto-creation of Todos
suite.test('POST /api/meetings saves note and auto-creates TodoItems', async () => {
  const meetingPayload = {
    title: 'Rapat Koordinasi Prodi Sistem Informasi',
    meetingDate: new Date().toISOString(),
    location: 'Ruang Rapat 201',
    attendees: ['Dr. Budi Santoso', 'Siti Aminah, M.Kom'],
    content: '<p>Pembahasan RPS dan Akreditasi.</p><p>#Revisi format RPS OBE @Dr._Budi_Santoso p1 T1:2026-10-15</p>',
    autoCreateTodos: true,
  };

  const res = await apiPost('/api/meetings', meetingPayload);
  assertEqual(res.status, 201, `Expected 201, got ${res.status}`);
  assert(res.data.id, 'Meeting should have ID');
  createdMeetingId = res.data.id;
  assert(Array.isArray(res.data.todos), 'Meeting should have todos array');
  assertEqual(res.data.todos.length, 1, 'Should have auto-generated 1 todo');
  assertEqual(res.data.todos[0].priority, 'P1', 'Todo priority should be P1');
});

// Test 4: Query Kanban Todos
suite.test('GET /api/todos lists kanban items with meeting link', async () => {
  const res = await apiGet('/api/todos');
  assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data), 'Expected array of todos');
  const found = res.data.find(t => t.meetingNoteId === createdMeetingId);
  assert(found !== undefined, 'Should find todo associated with the created meeting');
  assertEqual(found.priority, 'P1', 'Should preserve P1 priority');
});

// Test 5: Manual Todo Creation (Todoist Style)
suite.test('POST /api/todos creates manual task with priority and status', async () => {
  const todoPayload = {
    title: 'Input Nilai Tugas Mahasiswa',
    description: 'Batas akhir penginputan portal akademik',
    priority: 'P2',
    status: 'IN_PROGRESS',
    dueDate: '2026-10-10',
  };

  const res = await apiPost('/api/todos', todoPayload);
  assertEqual(res.status, 201, `Expected 201, got ${res.status}`);
  assert(res.data.id, 'Todo should have ID');
  createdTodoId = res.data.id;
  assertEqual(res.data.status, 'IN_PROGRESS', 'Status should be IN_PROGRESS');
  assertEqual(res.data.priority, 'P2', 'Priority should be P2');
});

// Test 6: Update Todo Status (Kanban progression)
suite.test('PUT /api/todos/:id updates status to DONE', async () => {
  const res = await apiPut(`/api/todos/${createdTodoId}`, { status: 'DONE' });
  assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
  assertEqual(res.data.status, 'DONE', 'Status should now be DONE');
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
