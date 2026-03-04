/**
 * usePersistedState
 *
 * Persists selected booking form fields to localStorage so returning clients
 * (on the same device/browser) get a pre-filled form experience.
 *
 * Schema version is embedded so stale data from old field shapes is discarded.
 */

const STORAGE_KEY = "racquet_booking_v1";

export interface PersistedBookingData {
    /** Schema version — bump when field shape changes to auto-clear stale data */
    version: 1;
    clientName: string;
    clientPhone: string;
    manufacturerId: string;
    modelId: string;
    stringTypes: string;
    mainsTensionLbs: string;
    crossTensionLbs: string;
}

/**
 * Reads persisted booking data from localStorage.
 * Returns null if nothing is stored, data is malformed, or the version is outdated.
 * Safe to call on SSR — falls back to null if window is not available.
 */
export function loadPersistedData(): PersistedBookingData | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<PersistedBookingData>;
        if (parsed.version !== 1) return null; // stale schema — discard

        return parsed as PersistedBookingData;
    } catch {
        return null;
    }
}

/**
 * Writes booking form data to localStorage.
 * Only persists the fields that make sense to pre-fill on return visits.
 * Intentionally excludes: urgency, dueDate, racquetCount.
 */
export function savePersistedData(
    data: Omit<PersistedBookingData, "version">
): void {
    if (typeof window === "undefined") return;

    try {
        const payload: PersistedBookingData = { version: 1, ...data };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // localStorage might be blocked (e.g. private browsing with strict settings)
        // Fail silently — this is an enhancement, not core functionality.
    }
}

/**
 * Clears persisted booking data from localStorage.
 */
export function clearPersistedData(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
}
