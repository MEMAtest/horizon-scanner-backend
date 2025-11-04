// Test script for date parsing fix
const path = require('path');

// Load the utils module
const utilsPath = path.join(__dirname, 'src/services/fcaFines/utils.js');
const ServiceClass = function() {};
ServiceClass.prototype.breachTypeMap = new Map();
require(utilsPath);

const utils = new ServiceClass();

console.log('='.repeat(60));
console.log('Testing Date Parsing Fix');
console.log('='.repeat(60));
console.log('');

// Test cases from actual FCA data
const testCases = [
  // UK Format (DD/MM/YYYY) - most common
  { input: '09/01/2025', expected: '2025-01-09', desc: 'UK format: 9 Jan 2025' },
  { input: '27/01/2025', expected: '2025-01-27', desc: 'UK format: 27 Jan 2025' },
  { input: '17/02/2025', expected: '2025-02-17', desc: 'UK format: 17 Feb 2025' },
  { input: '02/07/2025', expected: '2025-07-02', desc: 'UK format: 2 Jul 2025' },
  { input: '08/07/2025', expected: '2025-07-08', desc: 'UK format: 8 Jul 2025' },

  // Day Month Year format
  { input: '2 July 2025', expected: '2025-07-02', desc: 'Day Month Year' },
  { input: '8 July 2025', expected: '2025-07-08', desc: 'Day Month Year' },
  { input: '30 May 2025', expected: '2025-05-30', desc: 'Day Month Year' },

  // With ordinals
  { input: '2nd July 2025', expected: '2025-07-02', desc: 'With ordinal' },
  { input: '8th July 2025', expected: '2025-07-08', desc: 'With ordinal' },

  // ISO format
  { input: '2025-01-09', expected: '2025-01-09', desc: 'ISO format' },
  { input: '2024-06-15', expected: '2024-06-15', desc: 'ISO format' },

  // Edge cases that should fail gracefully
  { input: '32/01/2025', expected: null, desc: 'Invalid day (32)' },
  { input: '15/13/2025', expected: null, desc: 'Invalid month (13)' },
  { input: '', expected: null, desc: 'Empty string' },
  { input: null, expected: null, desc: 'Null input' },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = utils.parseDateFromText(test.input, 2025);
  const resultStr = result ? result.toISOString().split('T')[0] : null;
  const success = resultStr === test.expected;

  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${test.desc}`);
    console.log(`   Input: "${test.input}" → Output: ${resultStr}`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${test.desc}`);
    console.log(`   Input: "${test.input}"`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${resultStr}`);
  }
  console.log('');
});

console.log('='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
console.log('='.repeat(60));

if (failed === 0) {
  console.log('✅ All tests passed! Date parsing is fixed.');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the implementation.');
  process.exit(1);
}
