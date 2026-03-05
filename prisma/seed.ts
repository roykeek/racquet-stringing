import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // 1. Seed Manufacturers & Models
    const manufacturersData = [
        {
            name: 'Wilson',
            models: [
                'Pro Staff 97', 'Pro Staff 97 V14 / Classic', 'Clash 100', 'Clash 100 V2 / V3',
                'Blade 98', 'Blade 98 V9 / V10', 'Ultra 100', 'Ultra 100 V4',
                'RF01', 'RF01 Pro', 'RF 01 / RF 01 Future',
                'Shift 99 / 99L',
            ],
        },
        {
            name: 'Babolat',
            models: [
                'Pure Drive', 'Pure Drive 2021 / 2025',
                'Pure Aero', 'Pure Aero 2023 / 2026', 'Pure Aero 98',
                'Pure Strike', 'Pure Strike 2024 / V4',
                'Evo Drive / Aero',
            ],
        },
        {
            name: 'Head',
            models: [
                'Speed Pro', 'Speed Pro/MP 2024 / 2026', 'Speed Tour 97',
                'Radical MP', 'Radical Pro/MP 2023 / 2025',
                'Boom MP', 'Boom Pro/MP 2024 / 2026',
                'Gravity Pro', 'Gravity Pro/MP 2023 / 2025',
                'Prestige Pro', 'Prestige Pro/Tour 2023',
                'Extreme MP/Tour 2024 / 2026',
            ],
        },
        {
            name: 'Yonex',
            models: [
                'EZONE 98', 'EZONE 98/100 2022 / 2024',
                'VCORE 98', 'VCORE 95/98/100 2023 / 2026',
                'Percept 97', 'Percept 97/100',
                'Astrel 105/115',
            ],
        },
        {
            name: 'Dunlop',
            models: [
                'CX 200', 'CX 200 / 400 (2024)',
                'SX 300', 'SX 300 / Tour (2022 / 2025)',
                'FX 500', 'FX 500 / Tour (2023 / 2026)',
            ],
        },
        {
            name: 'Tecnifibre',
            models: [
                'T-Fight 305', 'TFight ISO 300/305',
                'TF40', 'TF40 305/315 (V2 / V3)',
                'TF-X1',
                'Tempo 298 IGA',
                'FIRE 300 / 305S',
            ],
        },
        {
            name: 'Prince',
            models: [
                'Phantom 97P', 'Phantom 97P / 100X',
                'Tour 100', 'Tour 95 / 98 / 100',
                'Ripstick 100', 'Ripstick 98 / 100',
                'Beast 98 / 100',
                'Ripcord 98 XS / 100',
                'Synergy 98',
            ],
        },
        {
            name: 'Volkl',
            models: [
                'V-Cell 8', 'V-Cell 10', 'V-Cell Series (1-10)',
                'Vostra V1 Pro / MP / OS',
                'Vostra V8 / V9 / V10',
                'Vostra V2 / V4 / V6',
                'Icon C10 Pro / Evo (2025)',
                'Icon V1 Classic / Evo (2025)',
            ],
        },
        {
            name: 'Other',
            models: ['Other'],
        },
    ]

    for (const mData of manufacturersData) {
        // Upsert manufacturer (creates if missing, no-op if exists)
        const manufacturer = await prisma.manufacturer.upsert({
            where: { name: mData.name },
            update: {},
            create: { name: mData.name },
        })

        // Upsert each model individually so re-running adds missing models safely
        for (const modelName of mData.models) {
            await prisma.racquetModel.upsert({
                where: {
                    name_manufacturerId: {
                        name: modelName,
                        manufacturerId: manufacturer.id,
                    },
                },
                update: {},
                create: {
                    name: modelName,
                    manufacturerId: manufacturer.id,
                },
            })
        }
        console.log(`Seeded manufacturer: ${mData.name} (${mData.models.length} models)`)
    }

    // 2. Seed Initial Stringer
    const hashedPassword = await bcrypt.hash('1t2k', 10)
    const initialStringer = await prisma.stringer.upsert({
        where: { name: 'Tomer' },
        update: {},
        create: {
            name: 'Tomer',
            passwordHash: hashedPassword,
        },
    })
    console.log(`Created stringer: ${initialStringer.name}`)

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
