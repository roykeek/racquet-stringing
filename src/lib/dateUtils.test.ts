import { formatDate } from './dateUtils';

describe('Date Utilities', () => {
    it('formatDate should return DD/MM/YYYY for a Date object', () => {
        const date = new Date('2026-03-06T10:00:00Z');
        // Note: The result depends on timezone if we just use getDate(), 
        // but for a fixed ISO string without local shift it should be fine for this test.
        // Actually, let's use a more robust check or UTC for testing if needed.
        const d = new Date(2026, 2, 6); // March 6, 2026
        expect(formatDate(d)).toBe('06/03/2026');
    });

    it('formatDate should return DD/MM/YYYY for an ISO string', () => {
        expect(formatDate('2026-12-25')).toBe('25/12/2026');
    });

    it('formatDate should return N/A for null or undefined', () => {
        expect(formatDate(null)).toBe('N/A');
        expect(formatDate(undefined)).toBe('N/A');
    });

    it('formatDate should return N/A for invalid date strings', () => {
        expect(formatDate('not-a-date')).toBe('N/A');
    });
});
