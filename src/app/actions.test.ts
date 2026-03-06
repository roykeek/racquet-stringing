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

        it('updateJobStatus() should set completedAt when status is Completed', async () => {
            prismaMock.serviceJob.update.mockResolvedValue({} as any);
            const { updateJobStatus } = require('./actions');

            const response = await updateJobStatus(1, 'Completed', 2);

            expect(response).toEqual({ success: true });
            expect(prismaMock.serviceJob.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: expect.objectContaining({
                    status: 'Completed',
                    stringerId: 2,
                    completedAt: expect.any(Date)
                })
            });
        });

        it('updateJobStatus() should clear completedAt when status reverts from Completed', async () => {
            prismaMock.serviceJob.update.mockResolvedValue({} as any);
            const { updateJobStatus } = require('./actions');

            await updateJobStatus(1, 'In Process');

            expect(prismaMock.serviceJob.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: expect.objectContaining({
                    status: 'In Process',
                    completedAt: null
                })
            });
        });
    });

    describe('Reporting Operations', () => {
        it('getMaterialUsageReport() should aggregate string mains and crosses correctly', async () => {
            const fakeJobs = [
                { stringMain: 'RPM Blast', stringCross: 'VS Touch' },
                { stringMain: 'RPM Blast', stringCross: 'RPM Blast' },
                { stringMain: 'Alu Power', stringCross: null }
            ];
            prismaMock.serviceJob.findMany.mockResolvedValue(fakeJobs as any);

            const { getMaterialUsageReport } = require('./actions');
            const result = await getMaterialUsageReport();

            expect(prismaMock.serviceJob.findMany).toHaveBeenCalledWith({
                where: { status: 'Completed' },
                select: { stringMain: true, stringCross: true }
            });

            // RPM Blast should have 2 mains + 1 cross = 3 total
            const rpm = result.find((r: any) => r.stringName === 'RPM Blast');
            expect(rpm).toBeDefined();
            expect(rpm.mainsCount).toBe(2);
            expect(rpm.crossesCount).toBe(1);
            expect(rpm.totalCount).toBe(3);

            // VS Touch should have 1 cross = 1 total
            const vs = result.find((r: any) => r.stringName === 'VS Touch');
            expect(vs.totalCount).toBe(1);

            // Alu Power should have 1 main = 1 total
            const alu = result.find((r: any) => r.stringName === 'Alu Power');
            expect(alu.totalCount).toBe(1);
        });

        it('getRestockAlerts() should return strings that meet or exceed the threshold', async () => {
            // Fake the findMany return directly for the internal call
            const fakeJobs = Array(10).fill({ stringMain: 'Popular String', stringCross: null });
            fakeJobs.push({ stringMain: 'Rare String', stringCross: null });

            prismaMock.serviceJob.findMany.mockResolvedValue(fakeJobs as any);

            const { getRestockAlerts } = require('./actions');
            const result = await getRestockAlerts(10, 30); // threshold 10

            expect(result).toHaveLength(1);
            expect(result[0].stringName).toBe('Popular String');
            expect(result[0].count).toBe(10);

            // Should add completedAt date filters to findMany
            expect(prismaMock.serviceJob.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: 'Completed',
                        completedAt: expect.objectContaining({
                            gte: expect.any(Date),
                            lte: expect.any(Date)
                        })
                    })
                })
            );
        });
        it('getJobsForExport() should return jobs within the specified date range', async () => {
            const fakeJobs = [{ id: 1, clientName: 'Export Test' }];
            prismaMock.serviceJob.findMany.mockResolvedValue(fakeJobs as any);

            const { getJobsForExport } = require('./actions');

            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            const endDate = new Date();

            const result = await getJobsForExport(startDate, endDate);

            expect(result).toHaveLength(1);
            expect(prismaMock.serviceJob.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: expect.any(Date) // end of day calculation
                        }
                    }
                })
            );
        });

        it('getJobsForExport() should throw an error if startDate is older than 2 years', async () => {
            const { getJobsForExport } = require('./actions');

            const oldDate = new Date();
            oldDate.setFullYear(oldDate.getFullYear() - 3);

            await expect(getJobsForExport(oldDate, new Date())).rejects.toThrow('Cannot export data older than 2 years.');
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
