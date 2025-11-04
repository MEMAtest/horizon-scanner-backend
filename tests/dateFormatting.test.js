jest.mock('../src/services/dbService', () => ({
    getEnhancedUpdates: jest.fn(),
    getDashboardStatistics: jest.fn(),
    getFilterOptions: jest.fn()
}));

let formatDate;
let getDateValue;
let truncateText;
let isFallbackSummary;

beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-01T00:00:00Z'));
    global.__consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    global.__consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    ({ formatDate, getDateValue, truncateText, isFallbackSummary } = require('../src/views/dashboard/helpers'));
});

afterAll(() => {
    jest.useRealTimers();
    global.__consoleLog.mockRestore();
    global.__consoleWarn.mockRestore();
});

describe('date helpers', () => {
    test('getDateValue returns Date for ISO string', () => {
        const value = getDateValue('2025-09-19T10:15:00Z');
        expect(value).toBeInstanceOf(Date);
        expect(isNaN(value)).toBe(false);
    });

    test('getDateValue handles Date instance', () => {
        const source = new Date('2025-09-19T10:15:00Z');
        const value = getDateValue(source);
        expect(value).toBe(source);
    });

    test('getDateValue returns null for invalid input', () => {
        expect(getDateValue('not-a-date')).toBeNull();
        expect(getDateValue(null)).toBeNull();
    });

    test('formatDate formats known date', () => {
        const formatted = formatDate('2025-09-19T10:15:00Z');
        expect(formatted).toBe('19 Sept 2025');
    });

    test('formatDate returns Unknown for invalid date', () => {
        expect(formatDate('invalid-date')).toBe('Unknown');
    });
});

describe('summary helpers', () => {
    test('truncateText shortens long text with ellipsis', () => {
        const result = truncateText('a'.repeat(210), 200);
        expect(result.endsWith('...')).toBe(true);
        expect(result.length).toBeLessThanOrEqual(203);
    });

    test('truncateText returns original when below threshold', () => {
        const value = 'Short summary';
        expect(truncateText(value, 200)).toBe(value);
    });

    test('isFallbackSummary detects fallback phrases', () => {
        expect(isFallbackSummary('Informational regulatory update: something')).toBe(true);
        expect(isFallbackSummary('Regulatory update: example')).toBe(true);
        expect(isFallbackSummary('Custom summary')).toBe(false);
    });
});
