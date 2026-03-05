import { loadPersistedData, savePersistedData, clearPersistedData, addDismissedModelId, getDismissedModelIds } from './usePersistedState';

describe('usePersistedState (Utility Functions)', () => {
    const STORAGE_KEY = 'racquet_booking_v3';

    beforeEach(() => {
        // Clear localStorage to ensure a clean slate before each test
        window.localStorage.clear();
        // Clear Jest mocks specifically if any spy functions are used
        jest.clearAllMocks();
    });

    describe('loadPersistedData', () => {
        it('should return null when localStorage is empty', () => {
            expect(loadPersistedData()).toBeNull();
        });

        it('should return null if the schema version is outdated', () => {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, clientName: 'Old Data' }));
            expect(loadPersistedData()).toBeNull();
        });

        it('should return null if JSON is malformed', () => {
            window.localStorage.setItem(STORAGE_KEY, '{ invalid json }');
            expect(loadPersistedData()).toBeNull();
        });

        it('should return valid data when schema matches', () => {
            const validData = {
                version: 3,
                clientName: 'Test Client',
                clientPhone: '0500000000',
                manufacturerId: '1',
                modelId: '2',
                stringMain: 'Alu Power',
                stringCross: 'VS Touch',
                mainsTensionLbs: '50',
                crossTensionLbs: '50',
                dismissedModelIds: [],
            };
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validData));
            expect(loadPersistedData()).toEqual(validData);
        });
    });

    describe('savePersistedData', () => {
        it('should save data with the correct version 3 signature', () => {
            const payload = {
                clientName: 'New Client',
                clientPhone: '0540000000',
                manufacturerId: '3',
                modelId: '4',
                stringMain: 'RPM Blast',
                stringCross: 'RPM Blast',
                mainsTensionLbs: '55',
                crossTensionLbs: '55',
            };

            savePersistedData(payload);

            const savedString = window.localStorage.getItem(STORAGE_KEY);
            expect(savedString).toBeDefined();

            const parsed = JSON.parse(savedString!);
            expect(parsed.version).toBe(3);
            expect(parsed.clientName).toBe('New Client');
            expect(parsed.dismissedModelIds).toEqual([]);
        });

        it('should preserve existing dismissedModelIds when overwriting the rest of the form data', () => {
            // Seed localstorage with a dismissed model
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
                version: 3,
                dismissedModelIds: ['99']
            }));

            savePersistedData({
                clientName: 'Jane',
                clientPhone: '',
                manufacturerId: '',
                modelId: '',
                stringMain: '',
                stringCross: '',
                mainsTensionLbs: '',
                crossTensionLbs: '',
            });

            const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
            expect(parsed.clientName).toBe('Jane');
            expect(parsed.dismissedModelIds).toEqual(['99']); // Dismissal is retained!
        });
    });

    describe('dismissedModelIds', () => {
        it('should add a model ID to empty storage', () => {
            addDismissedModelId('test-model-1');
            expect(getDismissedModelIds()).toEqual(['test-model-1']);
        });

        it('should not add duplicate model IDs', () => {
            addDismissedModelId('test-model-1');
            addDismissedModelId('test-model-1');
            expect(getDismissedModelIds()).toEqual(['test-model-1']);
        });
    });

    describe('clearPersistedData', () => {
        it('should remove the exact storage key from localStorage', () => {
            window.localStorage.setItem(STORAGE_KEY, 'some-data');
            window.localStorage.setItem('other-key', 'safe');

            clearPersistedData();

            expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
            expect(window.localStorage.getItem('other-key')).toBe('safe');
        });
    });
});
