/**
 * Formats a Date object or ISO string to DD/MM/YYYY
 */
export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "N/A";

    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";

    // Date-only strings (e.g. "2024-01-15") are parsed as UTC midnight by the JS engine.
    // Using local-time getters would shift the date for users in negative UTC offsets.
    // Use UTC getters for date-only strings to display the intended calendar date.
    const isDateOnly = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
    const day = String(isDateOnly ? d.getUTCDate() : d.getDate()).padStart(2, '0');
    const month = String((isDateOnly ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0');
    const year = isDateOnly ? d.getUTCFullYear() : d.getFullYear();

    return `${day}/${month}/${year}`;
}
