import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // 1. Seed Manufacturers & Models
    const manufacturersData = [
        {
            name: 'Wilson',
            models: ['Pro Staff 97', 'Clash 100', 'Blade 98', 'Ultra 100'],
        },
        {
            name: 'Babolat',
            models: ['Pure Drive', 'Pure Aero', 'Pure Strike'],
        },
        {
            name: 'Head',
            models: ['Speed Pro', 'Radical MP', 'Boom MP', 'Gravity Pro', 'Prestige Pro'],
        },
        {
            name: 'Yonex',
            models: ['EZONE 98', 'VCORE 98', 'Percept 97'],
        },
        {
            name: 'Other',
            models: ['Other'],
        },
    ]

    for (const mData of manufacturersData) {
        const manufacturer = await prisma.manufacturer.upsert({
            where: { name: mData.name },
            update: {},
            create: {
                name: mData.name,
                racquetModels: {
                    create: mData.models.map((modelName) => ({
                        name: modelName,
                    })),
                },
            },
        })
        console.log(`Created manufacturer with id: ${manufacturer.id}`)
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
