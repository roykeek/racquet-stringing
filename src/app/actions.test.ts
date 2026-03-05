import { prismaMock } from '../__mocks__/prisma';
import { getManufacturers, getModelsByManufacturerId, createServiceJob } from './actions';

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('next/headers', () => ({
    cookies: jest.fn(() => Promise.resolve({
        set: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
    })),
}));

jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

describe('Server Actions (API Layer)', () => {

    describe('Read Operations', () => {

        it('getManufacturers() should return manufacturers sorted with "Other" at the bottom', async () => {
            const fakeDbReturn = [
                { id: 1, name: 'Wilson' },
                { id: 2, name: 'Other' },
                { id: 3, name: 'Babolat' },
            ];
            prismaMock.manufacturer.findMany.mockResolvedValue(fakeDbReturn);

            const result = await getManufacturers();

            expect(prismaMock.manufacturer.findMany).toHaveBeenCalledWith({
                orderBy: { name: "asc" },
            });

            expect(result).toEqual([
                { id: 1, name: 'Wilson' },
                { id: 3, name: 'Babolat' },
                { id: 2, name: 'Other' },
            ]);
        });

        it('getModelsByManufacturerId() should filter by ID and sort "Other" to the bottom', async () => {
            const manufacturerId = 10;
            const fakeDbReturn = [
                { id: 101, name: 'Other', manufacturerId },
                { id: 102, name: 'Pure Drive', manufacturerId },
            ];
            prismaMock.racquetModel.findMany.mockResolvedValue(fakeDbReturn);

            const result = await getModelsByManufacturerId(manufacturerId);

            expect(prismaMock.racquetModel.findMany).toHaveBeenCalledWith({
                where: { manufacturerId },
                orderBy: { name: "asc" },
            });

            expect(result[result.length - 1].name).toBe('Other');
        });

    });

    describe('Write Operations', () => {

        const draftJob = {
            clientName: 'Test Client',
            clientPhone: '0501234567',
            modelId: 1,
            customRacquetInfo: null,
            stringMain: 'RPM Blast',
            stringCross: 'VS Touch',
            mainsTensionLbs: 55 as any,
            crossTensionLbs: 55 as any,
            racquetCount: 1,
            urgency: 'Standard',
            dueDate: new Date('2026-04-01T10:00:00Z')
        };

        it('createServiceJob() should return success and trackingId on valid creation', async () => {
            const mockCreatedJob = {
                id: 999,
                trackingUUID: 'abc-123-def',
                ...draftJob,
                status: 'Pending',
                createdAt: new Date(),
                updatedAt: new Date(),
                stringerId: null,
                scheduledDate: null,
                completedAt: null,
            };

            prismaMock.serviceJob.create.mockResolvedValue(mockCreatedJob);

            const response = await createServiceJob(draftJob);

            expect(response).toEqual({ success: true, trackingId: 'abc-123-def' });

            expect(prismaMock.serviceJob.create).toHaveBeenCalledWith({
                data: draftJob,
            });

            const { revalidatePath } = require('next/cache');
            expect(revalidatePath).toHaveBeenCalledWith('/stringer');
        });

        it('createServiceJob() should catch errors and return a failure payload', async () => {
            prismaMock.serviceJob.create.mockRejectedValue(new Error('Database Timeout'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            const response = await createServiceJob(draftJob);

            expect(response).toEqual({ success: false, error: 'Failed to create booking' });
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('Authentication Operations', () => {

        it('loginStringer() should return success when password matches', async () => {
            const bcrypt = require('bcrypt');

            const mockStringer = {
                id: 1,
                name: 'Tomer',
                passwordHash: 'hashed_password_123',
                failedLoginAttempts: 0,
                lockedUntil: null,
                isActive: true,
            };

            prismaMock.stringer.findUnique.mockResolvedValue(mockStringer);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

            const { loginStringer } = require('./actions');
            const response = await loginStringer(1, 'correct_password');

            expect(response).toEqual({ success: true });
        });

        it('loginStringer() should handle missing users', async () => {
            prismaMock.stringer.findUnique.mockResolvedValue(null);

            const { loginStringer } = require('./actions');
            const response = await loginStringer(999, 'any_password');

            expect(response).toEqual({ success: false, error: 'שזר לא נמצא' });
        });

    });

});
