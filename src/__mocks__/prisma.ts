import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import prisma from '../lib/prisma';

// 1. Tell Jest to mock the entire Prisma module
jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

// 2. Export the mocked instance so our tests can use it to assert calls and set return values
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// 3. Reset all mocks before each test runs to prevent test pollution
beforeEach(() => {
    mockReset(prismaMock);
});
