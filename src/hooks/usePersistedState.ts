/**
 * usePersistedState
 *
 * Persists selected booking form fields to localStorage so returning clients
 * (on the same device/browser) get a pre-filled form experience.
 *
 * Schema version is embedded so stale data from old field shapes is discarded.
 *
 * v3: Split stringTypes → stringMain + stringCross for hybrid string support.
 */

const STORAGE_KEY = "racquet_booking_v3";

interface PersistedBookingData {
    /** Schema version — bump when field shape changes to auto-clear stale data */
    version: 3;
    clientName: string;
    clientPhone: string;
    manufacturerId: string;
    modelId: string;
    stringMain: string;
    stringCross: string;
    mainsTensionLbs: string;
    crossTensionLbs: string;
    /** Model IDs the client has dismissed from the Smart History chips */
    dismissedModelIds: string[];
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
        if (parsed.version !== 3) return null; // stale schema — discard

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
    data: Omit<PersistedBookingData, "version" | "dismissedModelIds">
): void {
    if (typeof window === "undefined") return;

    try {
        // Preserve any existing dismissedModelIds when saving form data
        const existing = loadPersistedData();
        const payload: PersistedBookingData = {
            version: 3,
            ...data,
            dismissedModelIds: existing?.dismissedModelIds ?? [],
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // localStorage might be blocked (e.g. private browsing with strict settings)
        // Fail silently — this is an enhancement, not core functionality.
    }
}

/**
 * Returns the list of dismissed model IDs from localStorage.
 */
export function getDismissedModelIds(): string[] {
    const data = loadPersistedData();
    return data?.dismissedModelIds ?? [];
}

/**
 * Adds a model ID to the dismissed list in localStorage.
 * Prevents duplicate entries.
 */
export function addDismissedModelId(modelId: string): void {
    if (typeof window === "undefined") return;

    try {
        const existing = loadPersistedData();
        const dismissed = existing?.dismissedModelIds ?? [];

        if (dismissed.includes(modelId)) return; // already dismissed

        const updated: PersistedBookingData = existing
            ? { ...existing, dismissedModelIds: [...dismissed, modelId] }
            : {
                version: 3,
                clientName: "",
                clientPhone: "",
                manufacturerId: "",
                modelId: "",
                stringMain: "",
                stringCross: "",
                mainsTensionLbs: "",
                crossTensionLbs: "",
                dismissedModelIds: [modelId],
            };

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
        // Fail silently
    }
}

/**
 * Clears persisted booking data from localStorage.
 */
export function clearPersistedData(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
}
