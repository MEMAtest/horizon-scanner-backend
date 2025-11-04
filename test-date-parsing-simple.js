// Standalone test for date parsing fix
console.log('='.repeat(60));
console.log('Testing Date Parsing Fix');
console.log('='.repeat(60));
console.log('');

// Copy of the fixed parseDateFromText function
function parseDateFromText(dateText, fallbackYear) {
  if (!dateText) {
    console.warn(`No date text provided, using fallback: ${fallbackYear}-01-01`);
    return null;
  }

  const cleanText = dateText.trim();

  // UK Format: DD/MM/YYYY or DD-MM-YYYY (FCA standard)
  const ukFormat = cleanText.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (ukFormat) {
    const day = parseInt(ukFormat[1], 10);
    const month = parseInt(ukFormat[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(ukFormat[3], 10);

    // Validate date components
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 2000 && year <= 2030) {
      const date = new Date(Date.UTC(year, month, day, 0, 0, 0));
      // Verify the date is valid (handles invalid dates like Feb 30)
      const utcDay = date.getUTCDate();
      const utcMonth = date.getUTCMonth();
      const utcYear = date.getUTCFullYear();
      if (utcDay === day && utcMonth === month && utcYear === year) {
        console.log(`Parsed UK date: ${cleanText} → ${date.toISOString().split('T')[0]}`);
        return date;
      }
    }
  }

  // Day Month Year: "2 July 2025" or "2nd July 2025"
  const dayMonthYear = cleanText.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
  if (dayMonthYear) {
    const day = parseInt(dayMonthYear[1], 10);
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const month = monthNames.indexOf(dayMonthYear[2].toLowerCase());
    const year = parseInt(dayMonthYear[3], 10);

    if (month !== -1 && day >= 1 && day <= 31 && year >= 2000 && year <= 2030) {
      const date = new Date(Date.UTC(year, month, day, 0, 0, 0));
      const utcDay = date.getUTCDate();
      const utcMonth = date.getUTCMonth();
      if (utcDay === day && utcMonth === month) {
        console.log(`Parsed day-month-year: ${cleanText} → ${date.toISOString().split('T')[0]}`);
        return date;
      }
    }
  }

  // ISO Format: YYYY-MM-DD or YYYY/MM/DD
  const isoFormat = cleanText.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (isoFormat) {
    const year = parseInt(isoFormat[1], 10);
    const month = parseInt(isoFormat[2], 10) - 1;
    const day = parseInt(isoFormat[3], 10);

    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 2000 && year <= 2030) {
      const date = new Date(Date.UTC(year, month, day, 0, 0, 0));
      const utcDay = date.getUTCDate();
      const utcMonth = date.getUTCMonth();
      if (utcDay === day && utcMonth === month) {
        console.log(`Parsed ISO date: ${cleanText} → ${date.toISOString().split('T')[0]}`);
        return date;
      }
    }
  }

  // If we couldn't parse, log warning and return null
  console.warn(`Failed to parse date: "${cleanText}", returning null`);
  return null;
}

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
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = parseDateFromText(test.input, 2025);
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
