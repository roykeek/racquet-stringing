/**
 * Turso Setup Script
 * Creates tables and seeds data directly on Turso via @libsql/client,
 * bypassing Prisma CLI's sqlite:// URL validation.
 *
 * Usage:
 *   node prisma/turso-setup.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>
 */

import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';

const url = process.argv[2];
const authToken = process.argv[3];

if (!url || !authToken) {
    console.error('Usage: node prisma/turso-setup.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>');
    process.exit(1);
}

const client = createClient({ url, authToken });

async function createTables() {
    console.log('Creating tables...');

    await client.executeMultiple(`
        CREATE TABLE IF NOT EXISTS "Manufacturer" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "name" TEXT NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "Manufacturer_name_key" ON "Manufacturer"("name");

        CREATE TABLE IF NOT EXISTS "RacquetModel" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "name" TEXT NOT NULL,
            "manufacturerId" INTEGER NOT NULL,
            CONSTRAINT "RacquetModel_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "RacquetModel_name_manufacturerId_key" ON "RacquetModel"("name", "manufacturerId");

        CREATE TABLE IF NOT EXISTS "Stringer" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "name" TEXT NOT NULL,
            "passwordHash" TEXT NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
            "lockedUntil" DATETIME
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "Stringer_name_key" ON "Stringer"("name");

        CREATE TABLE IF NOT EXISTS "ServiceJob" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "trackingUUID" TEXT NOT NULL,
            "clientName" TEXT NOT NULL,
            "clientPhone" TEXT NOT NULL,
            "modelId" INTEGER,
            "customRacquetInfo" TEXT,
            "stringTypes" TEXT,
            "mainsTensionLbs" DECIMAL,
            "crossTensionLbs" DECIMAL,
            "racquetCount" INTEGER NOT NULL DEFAULT 1,
            "urgency" TEXT NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'Waiting',
            "stringerId" INTEGER,
            "dueDate" DATETIME NOT NULL,
            "scheduledDate" DATETIME,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ServiceJob_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "RacquetModel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
            CONSTRAINT "ServiceJob_stringerId_fkey" FOREIGN KEY ("stringerId") REFERENCES "Stringer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "ServiceJob_trackingUUID_key" ON "ServiceJob"("trackingUUID");
    `);

    console.log('✅ Tables created successfully.');
}

async function seedData() {
    console.log('Seeding data...');

    const manufacturersData = [
        { name: 'Wilson', models: ['Pro Staff 97', 'Clash 100', 'Blade 98', 'Ultra 100', 'RF01', 'RF01 Pro'] },
        { name: 'Babolat', models: ['Pure Drive', 'Pure Aero', 'Pure Strike'] },
        { name: 'Head', models: ['Speed Pro', 'Radical MP', 'Boom MP', 'Gravity Pro', 'Prestige Pro'] },
        { name: 'Yonex', models: ['EZONE 98', 'VCORE 98', 'Percept 97'] },
        { name: 'Dunlop', models: ['CX 200', 'SX 300', 'FX 500'] },
        { name: 'Tecnifibre', models: ['T-Fight 305', 'TF40', 'TF-X1'] },
        { name: 'Prince', models: ['Phantom 97P', 'Tour 100', 'Ripstick 100'] },
        { name: 'Volkl', models: ['V-Cell 8', 'V-Cell 10'] },
        { name: 'Other', models: ['Other'] },
    ];

    for (const mData of manufacturersData) {
        // Insert manufacturer (ignore if exists)
        await client.execute({
            sql: 'INSERT OR IGNORE INTO "Manufacturer" ("name") VALUES (?)',
            args: [mData.name],
        });

        // Get manufacturer id
        const result = await client.execute({
            sql: 'SELECT "id" FROM "Manufacturer" WHERE "name" = ?',
            args: [mData.name],
        });
        const manufacturerId = result.rows[0].id;

        // Insert models
        for (const modelName of mData.models) {
            await client.execute({
                sql: 'INSERT OR IGNORE INTO "RacquetModel" ("name", "manufacturerId") VALUES (?, ?)',
                args: [modelName, manufacturerId],
            });
        }
        console.log(`  ✅ ${mData.name} (${mData.models.length} models)`);
    }

    // Seed initial stringer
    const hashedPassword = await bcrypt.hash('1t2k', 10);
    await client.execute({
        sql: 'INSERT OR IGNORE INTO "Stringer" ("name", "passwordHash") VALUES (?, ?)',
        args: ['Tomer', hashedPassword],
    });
    console.log('  ✅ Stringer: Tomer');

    console.log('✅ Seeding complete!');
}

async function main() {
    try {
        await createTables();
        await seedData();
        console.log('\n🎉 Turso database is fully set up and ready!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main();
