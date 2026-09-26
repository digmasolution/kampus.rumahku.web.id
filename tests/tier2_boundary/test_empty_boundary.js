/**
 * Tier 2: Boundary & Corner Cases - Empty Input Handling & Oversized Fields
 * Tests handling of empty bodies, blank strings, extreme payload sizes,
 * empty array matrix, and deeply nested structures.
 */

const {
  createSuite,
  apiPost,
  apiGet,
  assert,
  assertEqual
} = require('../test_helper');

const suite = createSuite('Tier 2: Empty Inputs & Oversized Fields');

// Test 1: Empty POST Body
suite.test('POST /api/rps with empty body should not crash server', async () => {
  const res = await apiPost('/api/rps', {});
  // Should either succeed with default title/code or return 400 validation error cleanly
  assert(
    res.status === 200 || res.status === 201 || res.status === 400,
    `Expected 200, 201 or 400 for empty body, got ${res.status}`
  );
  if (res.status === 200 || res.status === 201) {
    assert(res.data && res.data.id, 'Should generate a valid record with fallback defaults');
  }
});

// Test 2: Empty Strings for required fields
suite.test('POST /api/rps with blank string fields should handle gracefully', async () => {
  const res = await apiPost('/api/rps', {
    title: '',
    courseName: '',
    courseCode: ''
  });

  assert(
    res.status === 200 || res.status === 201 || res.status === 400,
    `Expected 200, 201 or 400 for blank string fields, got ${res.status}`
  );
});

// Test 3: Oversized Payload (>1 MB)
suite.test('POST /api/rps with oversized payload (~1MB) should be handled or rejected safely', async () => {
  const largeString = 'A'.repeat(500 * 1024); // 500KB string
  const res = await apiPost('/api/rps', {
    title: 'Oversized Test',
    courseName: 'Big Data Processing',
    courseCode: 'BIG_101',
    data: {
      largeNote: largeString
    }
  });

  // Standard express json limit is 100kb by default unless configured; should return 413 or 200/201
  assert(
    res.status === 200 || res.status === 201 || res.status === 413 || res.status === 400,
    `Expected 200, 201 or 413 Payload Too Large, got ${res.status}`
  );
});

// Test 4: Empty weeklyPlan array
suite.test('POST /api/rps with 0-length weeklyPlan array should persist without schema corruption', async () => {
  const res = await apiPost('/api/rps', {
    title: 'Zero Weeks Test',
    courseName: 'Mini Seminar',
    courseCode: 'SEM_001',
    data: {
      weeklyPlan: []
    }
  });

  assert(res.status === 200 || res.status === 201, 'Expected 200 or 201 for document with empty weekly plan');
  const parsedData = typeof res.data.dataJson === 'string' ? JSON.parse(res.data.dataJson) : res.data.dataJson;
  assert(Array.isArray(parsedData.weeklyPlan), 'weeklyPlan must be an array');
  assertEqual(parsedData.weeklyPlan.length, 0, 'weeklyPlan should have length 0');
});

// Test 5: Deeply nested JSON structure
suite.test('POST /api/rps with 15-level deeply nested JSON structure should preserve integrity', async () => {
  let nested = { leaf: 'deep_value' };
  for (let i = 0; i < 15; i++) {
    nested = { [`level_${i}`]: nested };
  }

  const res = await apiPost('/api/rps', {
    title: 'Deep Nested Test',
    courseName: 'Advanced Recursion',
    courseCode: 'REC_999',
    data: nested
  });

  assert(res.status === 200 || res.status === 201, 'Expected 200 or 201 for deeply nested data');
  const docId = res.data.id;

  // Retrieve and verify data intact
  const getRes = await apiGet(`/api/rps/${docId}`);
  assertEqual(getRes.status, 200, 'Expected 200 OK on retrieval');
  const parsedData = typeof getRes.data.dataJson === 'string' ? JSON.parse(getRes.data.dataJson) : getRes.data.dataJson;

  let curr = parsedData;
  for (let i = 14; i >= 0; i--) {
    assert(curr[`level_${i}`] !== undefined, `Level ${i} should be preserved in DB roundtrip`);
    curr = curr[`level_${i}`];
  }
  assertEqual(curr.leaf, 'deep_value', 'Leaf value should be preserved');
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
